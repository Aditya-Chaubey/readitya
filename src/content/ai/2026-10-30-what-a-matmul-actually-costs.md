---
title: "What a Matmul Actually Costs"
tldr: "A matrix multiply pays two bills at once, one in arithmetic and one in memory traffic. The arithmetic depends only on three integers. The memory usually decides the clock."
date: 2026-10-30T09:00:00+05:30
level: Beginner
tags: [foundations, gpu, performance, flops]
sources:
  - { label: "NVIDIA, Matrix Multiplication Background User's Guide", url: "https://docs.nvidia.com/deeplearning/performance/dl-performance-matrix-multiplication/index.html" }
  - { label: "Williams, Waterman and Patterson, Roofline: An Insightful Visual Performance Model for Multicore Architectures (CACM, 2009)", url: "https://people.csail.mit.edu/matei/courses/2015/6.S897/readings/roofline.pdf" }
  - { label: "NVIDIA A100 Tensor Core GPU datasheet, 80GB SXM", url: "https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/a100/pdf/nvidia-a100-datasheet-us-nvidia-1758950-r4-web.pdf" }
  - { label: "Kaplan et al., Scaling Laws for Neural Language Models (2020)", url: "https://arxiv.org/html/2001.08361v1" }
  - { label: "Hoffmann et al., Training Compute-Optimal Large Language Models (Chinchilla, 2022)", url: "https://proceedings.neurips.cc/paper_files/paper/2022/file/c1e2faff6f588870935f114ebe04a3e5-Paper-Conference.pdf" }
  - { label: "Cormen, Leiserson, Rivest and Stein, Introduction to Algorithms, section 15.2 on matrix-chain multiplication", url: "https://www.cs.cmu.edu/afs/cs/academic/class/15451-s04/www/Lectures/CRLS-DynamicProg.pdf" }
  - { label: "JAX Scaling Book, All the Transformer Math You Need to Know", url: "https://jax-ml.github.io/scaling-book/transformers/" }
drafted_with: [DeepSeek]
draft: false
---

Take a 4,096 by 4,096 matrix of weights. Push 128 token vectors through it in half precision, on an A100.

The arithmetic is easy to count. Every output value is a dot product of length 4,096, and there are 128 by 4,096 of them. So the card has 4.3 billion multiply-adds to chew through. Spread over its rated 312 trillion operations a second, that is 13.8 microseconds.

Then you run it, and it takes about 17.5 microseconds.

For one afternoon the gap looks like launch overhead, or the operating system, or whatever your profiler labels as noise. Then you run the same multiply on a shape half a percent larger, and it takes twice as long. The floating point count did not move nearly enough to explain that.

Two bills arrive at once here. Neither of them is the arithmetic you just counted.

## The first bill

A multiply of an m by k matrix with a k by n matrix has a cost you can write down. It is `2 × m × n × k` floating point operations.

The 2 is honest. Each output value is a dot product of length k, which takes k multiply-adds, and hardware fuses each pair into one instruction. NVIDIA's performance guide counts the fused operation as two, because the multiply and the add are both real work on real numbers.

Sit with what that formula can see. It takes three integers. It cannot see the values inside the arrays.

Multiply matrices full of random noise, and you get that bill. Multiply matrices full of the number one, and you get the same bill. Multiply matrices that are ninety percent zeros, and you get the same bill again.

That last case makes people stumble. A sparse matrix is not cheaper to multiply unless the chip is built to notice the zeros. NVIDIA's A100 datasheet lists 312 TFLOPS for half precision, and 624 with an asterisk for sparsity. The second number describes a card that can prove half the weights are zeros, and then decline to multiply them.

![Each entry of the output is one row of the first matrix meeting one column of the second](/images/ai/ai-2026-10-30-matmul-diagram.png)

*Every output entry is a dot product of length k, and there are m times n of them. That is where `2 × m × n × k` comes from. Image: User1042, CC BY-SA 4.0, via Wikimedia Commons.*

## The second bill

The arithmetic is only half of it. Every number the chip multiplies has to arrive from memory first, and memory is a slower road than the arithmetic units beside it.

Count the arrivals for one multiply. The inputs are m by k and k by n. The output is m by n. If nothing is reused from cache, that is `m×k + k×n + m×n` values read or written, whatever their size in bytes.

Divide the two and you get a ratio with a name. Arithmetic intensity for a matmul works out to `m×n×k / (m×k + k×n + m×n)`. NVIDIA prints that same expression in their guide, and works two examples. Their 8192 by 128 by 8192 case scores 124. Their 8192 by 8192 by 8192 case scores 2,730.

Now you need something to compare it against, and that number belongs to the card rather than the problem. Take peak arithmetic and divide by peak bandwidth. The A100 with 80 gigabytes runs at 312 TFLOPS and 2,039 gigabytes a second, so `312e12 / 2.039e12` gives 153.

That 153 is flops per byte. Above it, arithmetic limits you. Below it, memory does.

The idea is old and has a good name. Samuel Williams, Andrew Waterman and David Patterson published it as the roofline model in 2009. The flat part of the roof is the arithmetic you cannot exceed. The sloped part is the memory you cannot feed any faster.

Our 128-token multiply lands at 120 flops per byte. That is under 153, so memory sets the pace. Count the bytes and you get 35.7 megabytes moving, which at 2,039 gigabytes a second takes 17.5 microseconds. That is the number the stopwatch gave us. The arithmetic was never the constraint.

![A curve rising steeply and then flattening at 312 TFLOPS](/images/ai/ai-2026-10-30-matmul-1.png)

*The same 4,096-wide layer, pushed harder. Attainable throughput climbs almost linearly until the batch clears about 165 tokens, then the card is full however many tokens you add.*

There is a clean consequence. A square half-precision matmul needs a side of at least 459, since `3 × 153 = 459`, before arithmetic becomes the limit. Anything smaller cannot reach peak, however good the code.

And a matrix times a single vector, the case where n is 1, has an intensity below 1. That is a model generating one token at a time. Its ceiling on this card works out to about 2 TFLOPS out of 312, because the processors spend nearly all their time waiting for weights to arrive. This is the entire reason batching exists.

## The cliff

Now the shape that breaks the stopwatch, and intensity has nothing to do with it.

An A100 has 108 streaming multiprocessors. cuBLAS cuts the output into tiles, and its preferred tile is 256 by 128. Fix m at 2,304. That divides into nine tiles down the columns.

Set n to 1,536. Across the rows you get twelve tiles, and `9 × 12 = 108`. One wave of tiles, every processor busy, nothing left over.

Set n to 1,544, which is eight columns more. Now you get thirteen tiles across and 117 in total. One full wave, then a tail wave of nine tiles using 9 of the 108 processors. NVIDIA measured this and reports that throughput roughly halves, while duration roughly doubles. Half a percent more work, twice the clock.

![Four bars, 108, 117, 216 and 225, for output widths 1536, 1544, 3072 and 3080](/images/ai/ai-2026-10-30-matmul-2.png)

*Tile counts for m = 2,304 with 256 by 128 tiles. 108 fills one wave exactly. 117 needs a second wave, and only nine of its tiles have work to do.*

There is a smaller version of the same trap. With 128 by 128 tiles, two dimensions that miss the boundary by a little make the hardware run 1.5 times the arithmetic the maths needs. The problem itself is 0.39 percent bigger.

None of this shows up in the flop count. All of it shows up in the shape.

## Ten times the bill for the same answer

Matrix multiplication is associative, so a chain of them can be bracketed any way you like. The result is the same. The cost is not.

Take three matrices of size 10 by 100, 100 by 5, and 5 by 50. Bracket them as `(A × B) × C` and you do 5,000 multiplications, get a 10 by 5 result, then spend 2,500 more. Total, 7,500.

Bracket the same three as `A × (B × C)` and you do 25,000 multiplications to build a 100 by 50 middle, then 50,000 more to finish. Total, 75,000.

Same answer, ten times the bill. Cormen, Leiserson, Rivest and Stein use exactly this chain, and call the first order "10 times faster".

The cost of a matmul is a function of its shapes and its brackets. The values never enter.

## Where a training run's bill goes

Put enough matmuls together and you get a language model, and the count stays just as simple.

One parameter touches one token in the forward pass and costs two flops. The backward pass needs twice that, which is four. So training costs about six flops per parameter per token, written `6 × N × D`. The OpenAI scaling laws paper of 2020 put it as `C ≈ 6NBS` and named the 6 outright: the forward and backward passes.

Chinchilla is the tidy example. Seventy billion parameters, 1.4 trillion tokens, so `6 × 70e9 × 1.4e12`, which is 5.9e23 flops. Gopher was four times larger and burned a near-identical budget. The smaller model won nearly every benchmark.

That rule has a hole, and the people who wrote it said so. Kaplan and his coauthors admit that their estimate "did not include contributions proportional to n_ctx". They warn that the scaling may be confounded once context length climbs past roughly twelve times the model width.

Here is how slowly that arrives. Attention's cost grows with the square of the context. The JAX scaling guide derives the ratio of attention flops to the rest as `T / 8D`, with T the context and D the model width. For a width of 4,096, attention only overtakes the dense layers at 32,768 tokens. At a width of 8,192, it takes 65,536.

The quadratic blowup is real. It arrives at the context lengths people were arguing about in 2026, rather than the ones most of us train at.

## What the clock is made of

Go back to the 4,096 by 4,096 matrix and the 128 tokens, and the 17.5 microseconds.

You could rewrite every value in those two arrays and the time would not move by a nanosecond. You could fill them with zeros. You could multiply them in a different language, on a better compiler, and shave a little off. The values are free.

Change the shapes, and the bill moves by a factor of ten. Change the brackets, and it moves again. Round the dimensions up to the tile boundary, and it halves.

A matmul costs what it is shaped like.
