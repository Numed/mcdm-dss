# MCDM Decision Support System

A web app that helps choose the best alternative when there are many criteria grouped by goals. Built as the software part of my master's thesis.

Live demo: https://mcdm-dss.vercel.app

## What it does

- Define alternatives, criteria and goal groups, with weights and parameters
- Normalize the data and rank alternatives with a matrix-based method
- Run sensitivity and robustness analysis to see how stable the ranking is
- Compare projects side by side
- Visualize results with charts and render formulas with KaTeX
- Import and export data as Excel files, generate a report and a presentation view

## Tech stack

React 19, TypeScript, Zustand, Tailwind CSS 4, shadcn/ui (Radix UI), Vite, Vitest

## Architecture

- `src/core/` - computation core in pure TypeScript, independent of the UI and covered by unit tests
- `src/pages/` - one page per step of the workflow
- `src/components/` - UI and chart components
- `src/store/` - Zustand stores

## Getting started

    npm install
    npm run dev          # development
    npm test             # tests for the computation core
    npm run build        # production build
    npm run build:single # single-file HTML build
