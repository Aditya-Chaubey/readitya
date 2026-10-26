---
title: "What a Decision Tree Actually Does"
tldr: "A decision tree predicts by asking a short series of yes-or-no questions. It is easy to draw, easy to check by hand, and still hard to beat on spreadsheet-shaped data."
date: 2026-10-27T00:30:00+05:30
level: Beginner
tags: [classical-ml, basics]
sources:
  - { label: "Quinlan, Induction of Decision Trees (1986)", url: "https://link.springer.com/article/10.1007/BF00116251" }
  - { label: "scikit-learn: Decision Trees (user guide)", url: "https://scikit-learn.org/stable/modules/tree.html" }
  - { label: "Grinsztajn et al., Why tree-based models still outperform deep learning on tabular data (2022)", url: "https://arxiv.org/abs/2207.08815" }
drafted_with: [Muse Spark 1.3]
draft: false
---

Your backpack is missing on a school morning. You do not turn the whole house over at once. You stand in the hall and ask a small question that cuts the search down. Did I leave it by the door? A yes sends you toward the door. A no sends you toward the bedroom. Each answer leaves you with a smaller place to look. You trust the process because you can see every choice.

A decision tree predicts by asking one yes-or-no question about one column of data at a time, then following the answer to the next question. A column here means one tracked fact, like hours studied for each student. The tree looks at one tracked fact. It asks. It follows the answer to the next question. If talk about AI makes you wary, this is a friendly place to start. You can trace each split on paper and argue with it.

## The pile on the kitchen table

Picture ten exam records spread on a table. Five students passed. Five failed. You want a way to say how mixed that pile feels before you start sorting it.

Ten students: five passed, five failed, so the starting pile has Gini impurity 0.5.

That number tells how mixed a pile is, where zero would mean every row agrees and `0.5` means a half and half split. The tree wants questions that make that mix number go down. It tries a question. It looks at the two new piles that result. It scores each one for mix. Then it takes a weighted average, where big piles pull more weight than small ones.

You can check all of this by hand if you like counting. No hidden math sits behind it. Just count how many passed and how many failed on each side.

## How the tree picks a question

Start with study time, because it feels like it should matter. The tree tries a cut at four hours. Everyone at or below that line goes one way. Everyone above it goes the other.

Splitting on hours at 4 puts four students on one side, all failed (Gini 0), and six on the other, one failed and five passed (Gini 0.278). Weighted together that is 0.167, a gain of 0.333.

Gain is the word for the drop in mix. You started at `0.5`. After the split the weighted mix is `0.167`. The drop between them is `0.333`. A large drop means the question cleared up a lot of confusion.

Now try the other tracked fact, whether the student showed up for lectures.

Splitting on whether they attended lectures instead gives a gain of only 0.183.

Both questions help a little. Hours helps more because `0.333` beats `0.183`. So the tree puts hours at the top, with students with four hours or fewer going left and the rest going right. The rule for picking is called greedy, which means the tree takes the best gain it can see right now without checking if a weaker first question might set up a smarter pair later.

## What lives at the end of a branch

Follow the yes and no answers down far enough and the tree has to stop and say something. That stopping place, where past rows collect and wait for a call, is called a leaf. Whatever it says is just the average of the numbers, or the most common answer, among the training rows that landed there, and training rows means the old rows you built the tree from. So the tree can only repeat what it already saw. It cannot predict a value outside the range it was trained on.

A leaf containing three passes and one fail reports a probability of 0.75, which is a frequency from four rows.

That `0.75` sounds sure until you look at where it came from. Three out of four old rows passed. One new student could swing that share a lot. So read it as three in four, not as deep sureness.

Trees also answer in flat jumps rather than smooth slopes. Look at the chart below and you will see the shape.

![Step chart showing a flat tree prediction that jumps at four hours and again at six hours beside a steadily rising straight line](/images/ai/ai-2026-10-26-alt-1.png)

*A tree answers in steps: its prediction jumps at four hours and again at six. A straight line can only tilt.*

The tree stays flat, then jumps at the cut, then stays flat again. A straight line has to tilt a little at a time. The stepped shape fits school life pretty well. An extra half hour of cramming may do nothing for a while, then something clicks after you cross a point.

## An old recipe that still wins tables

Picking the best cut by hand gets slow fast. People wanted a fixed set of steps they could run the same way every time. Ross Quinlan published the ID3 algorithm in 1986 in the journal Machine Learning; the paper has been cited roughly fourteen thousand times. ID3 was one early fixed set of steps for choosing which question to ask first, and that high citation count means many later papers built on it.

To test ideas fairly you need the same tasks for every method, a setup people call a benchmark. In a 2022 benchmark across 45 datasets shaped like spreadsheets, trees still beat deep learning on medium-sized tables of around ten thousand rows. Deep learning here means the big layered systems that tune enormous numbers of knobs; trees need far less from the data to do their job. On sheets of that size, the plain question asker won.

Small sheets leave large systems with little to learn from. Trees need less. They count and split and show each choice. Many people build them with a free kit called scikit-learn, whose guide is blunt about what trees cannot do.

## Three honest limits

The first limit is about range. A tree only repeats piles it has seen. If no past row studied twelve hours a night, the tree has no leaf for that case. It will drop that keen new student into the highest leaf it has and give the same answer as before. It will not stretch higher. A line would keep rising. A tree holds flat.

The second limit is about regret. The guide from scikit-learn is plain here. scikit-learn's own documentation states that the algorithm is greedy, makes locally optimal decisions, cannot guarantee a globally optimal tree, and struggles with concepts like XOR and parity. Locally optimal means best for this one split. Globally optimal means the best full tree you could find if you tried every shape. The tree picks now and moves on. It can miss a pair of questions that look weak alone but work well as a team.

The third limit is about teamwork between facts. Sometimes the answer turns on whether two facts match. One fact alone tells you nothing. You have to see both at once. Patterns of that kind go under the names XOR and parity, where parity means an even or odd match across many facts. A tree can only look at one tracked fact per question. So it has to cut one way and then cut again to fake a joint rule. The chart below shows why that feels clumsy.

![Scatter plot with passes on the top right and bottom left corners and fails on the other two corners so no single vertical or horizontal cut separates them](/images/ai/ai-2026-10-26-alt-2.png)

*When the two classes sit on opposite corners like this, no single vertical or horizontal line separates them. A tree has to cut twice, which is why some patterns are awkward for it.*

Pass and fail sit on opposite corners. No lone up and down cut will split them. No lone left and right cut will split them either. The tree can still get there with two cuts. It wastes steps along the way. Parity grows that pain larger, because many facts have to line up. A very deep tree will keep splitting until every leaf is pure, which means roughly one rule per training row: perfect on the data it has seen, useless on new data. Pure means each leaf holds one answer only. That is memorizing rather than learning.

## Try it with a pencil

Take ten slips of paper. Mark five for pass and five for fail, to match our starting pile. Pick one fact you know about each friend, like hours slept before the test. Try a split and count the mix on the left and on the right. Keep the split with the larger drop in mix.

Then look hard at your leaf. How many slips landed there? Would you trust a call drawn from four slips? Would you keep splitting until each leaf held one slip? Keep those questions ready the next time someone shows you a smart system, and ask what question came first and which old rows sit in the leaf that gave the answer.
