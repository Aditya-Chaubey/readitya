---
title: "The Machine That Only Asks Yes or No"
tldr: "A decision tree learns by asking one simple yes-or-no question at a time. It is the oldest idea in machine learning, and still the hardest thing to beat when your data lives in a spreadsheet."
date: 2026-10-26T20:00:00+05:30
level: Beginner
tags: [classical-ml, basics, intuition]
sources:
  - { label: "Quinlan, Induction of Decision Trees (1986)", url: "https://link.springer.com/article/10.1007/BF00116251" }
  - { label: "scikit-learn: Decision Trees (user guide)", url: "https://scikit-learn.org/stable/modules/tree.html" }
  - { label: "Grinsztajn et al., Why tree-based models still outperform deep learning on tabular data (2022)", url: "https://arxiv.org/abs/2207.08815" }
drafted_with: [DeepSeek]
draft: false
---

You have played this game. Someone thinks of a thing — a person, a place, an object — and you get twenty questions to find it. Every question has to be answerable with yes or no.

Watch a good player. They do not guess. Their first question splits the world roughly in half: *is it alive?* Their second halves what is left. A bad player asks something that rules out almost nothing — *is it smaller than a bus?* — and burns a question for free.

That instinct, the one you already have, is the entire algorithm behind a **decision tree**. It is the oldest idea in machine learning, still in daily use, and still the thing to beat whenever your data arrives as a spreadsheet.

## The only move it knows

A decision tree predicts by walking you down a chain of questions. Each question compares one column of your table to a number. Answer it, go left or right, answer the next one. Whatever box you end up in holds the prediction.

Notice how narrow that is. The tree can ask *is the distance above 20 km?* It cannot ask *is the cost more than twice the distance?* One column, one number, yes or no. That narrowness sounds like a weakness. It is the source of nearly everything the tree is good at, and nearly everything it cannot do.

## Ten students walk into an exam

Here is a small table. Ten students, two columns, and one thing we want to predict: did they pass?

| Hours studied | Went to lectures | Result |
| --- | --- | --- |
| 1 | no | fail |
| 2 | no | fail |
| 3 | yes | fail |
| 4 | no | fail |
| 5 | yes | pass |
| 6 | yes | pass |
| 7 | no | fail |
| 8 | yes | pass |
| 9 | yes | pass |
| 10 | yes | pass |

Five passes, five fails. And one awkward row: student seven studied for seven hours, skipped the lectures, and failed anyway. Real tables are full of rows like that. Keep an eye on it.

## How mixed is this pile?

The tree builds itself by asking one question at every step: *which cut leaves the two new piles less mixed than the pile I started with?*

So it needs a number for "mixed". The usual one is the **Gini impurity**, and before any symbols, here is the whole idea in a sentence. Gini answers: **if I picked two students from this pile at random, how likely is it that one passed and the other failed?**

Our ten students are five and five. Pick two at random and they disagree about half the time, so the pile scores 0.5. A pile of four students who all failed can never disagree with itself, so it scores 0. Everything else falls between those two.

![A curve showing impurity peaking when a pile is half and half](/images/ai/ai-2026-10-26-1.png)

*A pile where everyone passed is perfectly clean, scoring 0. A fifty-fifty pile is as mixed as it gets, scoring 0.5. Every cut is an attempt to move left along this curve.*

The formula, if you want it, is `Gini = 1 - (p1² + p2²)`, where `p1` and `p2` are the shares of each class. Take the share of passes, square it, take the share of fails, square it, add them, subtract from one. Half and half gives you 1 minus (0.25 + 0.25), which is 0.5. One single class gives you 1 minus 1, which is 0.

The squaring is the clever bit. It punishes small shares, so lopsided piles score low and balanced piles score high.

## The first cut

Now the tree tries every column and every threshold, and keeps whichever cut lowers that number the most.

**Cut on hours, at four.** The left pile is students one to four, all four failed, so it scores 0. The right pile is one fail among five passes, which scores about 0.278. To combine them we weight by size — four students left, six right — giving `0.4 × 0 + 0.6 × 0.278 = 0.167`.

The pile started at 0.5. It is now 0.167. That is a drop of **0.333**.

**Cut on lectures instead.** The students who attended split into one fail and five passes, scoring 0.278. The ones who skipped split into three fails and one pass, scoring 0.375. Weighted: `0.6 × 0.278 + 0.4 × 0.375 = 0.317`. A drop of **0.183**.

Hours wins, 0.333 against 0.183, and that is the first question in the tree. Neither cut is clean. The tree did not need clean — it needed the best available.

![A decision tree with two questions and three leaves](/images/ai/ai-2026-10-26-2.png)

*The first question does most of the work. The second buys a little more, and the box on the right is still mixed — one failed student is hiding in there.*

## The rule that exists to be wrong about one person

That leftover box is where the trouble starts. Four students, three passes, one fail. It is student seven, again.

The tree can fix this. Ask one more question — hours at seven — and student seven lands in a leaf all by himself, perfectly pure, impurity zero. The score improves. The model gets worse.

This is **overfitting**, and that one-row leaf is the whole disease in miniature. A rule whose only job is to be wrong about one student fewer on the exam you already marked tells you nothing about the next exam. Grow a tree without limits and it will keep splitting until every leaf is pure, which on real data means roughly one rule per training row. Perfect on what it has seen. Useless on what it has not.

Every library gives you the same three brakes. The defaults are permissive, so you get the overfitted tree unless you intervene. Cap the depth. Demand a minimum number of rows in every leaf. Or prune afterwards and charge the tree a fee for each leaf it keeps. If your leaves hold one or two rows, you did not fit a model. You indexed a spreadsheet.

## What the tree is really doing to your data

Step back from the students and look at the geometry, because this is the part that explains everything else.

Plot two columns as a flat sheet of paper. A question like *hours at four* is a vertical line. A question about lectures is a horizontal line. So every cut is a wall running parallel to one of the axes, and the leaves of the tree are the rectangular rooms those walls enclose.

![A trained decision tree for the iris dataset, with splits and leaf statistics](/images/ai/ai-iris-classification-tree.png)

*A real tree, trained on the iris dataset: 150 flowers, four measurements, three species. Do not bother reading every number — look at the shape. A handful of yes-or-no questions is enough to separate three species almost perfectly. Image: Dvd8719, CC BY-SA 4.0, via Wikimedia Commons.*

And that immediately tells you what a tree cannot do. Suppose the rule is "pass if the hours and the lecture attendance agree, fail if they disagree" — the classic XOR pattern, two diagonal stripes. No single vertical or horizontal wall separates diagonal stripes. The tree would have to cut many times, building a staircase to approximate a diagonal.

scikit-learn's own documentation is refreshingly blunt about this: the algorithm is greedy, makes the locally best choice at each node, cannot guarantee the best possible tree, and struggles with concepts like XOR and parity. The greed is not a bug to be fixed. It is what makes the tree fast and readable.

## Why it still beats neural networks on spreadsheets

In 2022, three researchers assembled 45 tabular datasets and tuned every model properly — neural networks included. Tree-based models still came out on top on medium-sized tables, around ten thousand rows, before anyone counted how much faster they are.

Their explanation comes down to three things, and all three follow from the staircase:

Neural networks are built to expect smoothness — nearby inputs give nearby outputs. That is a gift for images. Tables are not smooth. A credit score of 699 is fine and 700 is refused. Trees expect nothing smooth, because they are flat by construction.

Neural networks also suffer when a table carries useless columns, because they have to spend capacity learning that a column is noise. A tree simply never picks it: a useless column produces no gain.

And tables are built by humans, one column at a time, so the useful directions are already lined up with the axes. Trees cut along those axes. Neural networks mix the columns together first, and lose that alignment.

For context on how long this idea has been earning its keep: Quinlan's 1986 paper describing the ID3 algorithm has been cited around fourteen thousand times.

## Three things it cannot do

- **It cannot extrapolate.** Every prediction is the average of the rows that landed in that leaf, so it never returns a value beyond the range it saw. Show it a house twice as large as anything in training and it gives you the most expensive box's average.
- **It is twitchy.** Change a few rows and the top question can flip, reshuffling everything below it. Two trees fitted on different halves of the same data can look unrelated. Averaging many of them — a random forest — is the standard fix.
- **Its probabilities are coarse.** A leaf with three passes and one fail says 0.75, which is a frequency from four students, not a law of nature.

## The last question

Every model in the family — the forest, the boosted ensemble that wins most Kaggle tables, the ones with names you have not met yet — is a variation on one move: **where do I cut?**

Learn the tree as a staircase, and the rest of the family reads as refinements of the same question.

So the next time an insurance form asks you five yes-or-no questions and then quotes you a price, you will know exactly what just happened. You walked down a decision tree. Someone, somewhere, decided where the walls go.
