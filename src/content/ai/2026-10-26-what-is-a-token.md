---
title: "What Is a Token?"
tldr: "A token is the small chunk of text an AI model actually reads and writes, usually a piece of a word, and everything from cost to memory limits is counted in them."
date: 2026-10-26T09:00:00+05:30
level: Beginner
tags: [llm, basics]
sources:
  - { label: "OpenAI Tokenizer (try it yourself)", url: "https://platform.openai.com/tokenizer" }
  - { label: "Hugging Face: Summary of the tokenizers", url: "https://huggingface.co/docs/transformers/tokenizer_summary" }
drafted_with: [DeepSeek, Gemini]
draft: true
---

When you type a message to ChatGPT or Claude, the model never sees your words the way you do. Before anything happens, your text is chopped into small pieces called **tokens**. The model reads tokens, thinks in tokens, and replies one token at a time.

## The everyday analogy

Think of LEGO. You could make a set where every possible object is one giant moulded piece, but you'd need millions of different pieces. Instead, LEGO uses a few hundred standard bricks that combine into anything.

Tokens are the bricks of language. Rather than storing every word that exists, a model learns a fixed set of around 50,000 to 200,000 common chunks, and builds every sentence out of them.

## How it actually works

A common word like `the` is usually one token. A rarer word gets split into familiar pieces:

| Text | Tokens (roughly) |
| --- | --- |
| `cat` | `cat` |
| `unbelievable` | `un` · `believ` · `able` |
| `ChatGPT` | `Chat` · `G` · `PT` |

Each token is then swapped for a number (its ID in the vocabulary), and those numbers are what the model does its maths on. A rough rule for English: **one token is about ¾ of a word**, so 100 tokens is roughly 75 words.

## Why it matters

- **Cost.** AI APIs charge per token, both for what you send and what you get back.
- **Memory.** A model's "context window" (how much it can look at at once) is measured in tokens, not pages.
- **Odd mistakes.** Ask a model how many r's are in "strawberry" and it may slip, because it sees `straw` · `berry`, not ten separate letters.
- **Other languages.** Hindi or Japanese text often needs more tokens than the same sentence in English, which makes it slower and pricier.

## A common misconception

> "Tokens are just words."

Not quite. A token can be a whole word, part of a word, a single character, a space, or even punctuation. That's exactly why the model can handle words it has never seen: it just snaps together smaller bricks.

## Try it yourself

Paste any sentence into a tokenizer tool (linked below) and watch it split. Try your name, a long German word, and an emoji. You'll quickly get a feel for what the model "sees."
