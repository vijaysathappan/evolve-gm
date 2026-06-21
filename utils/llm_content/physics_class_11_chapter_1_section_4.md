# 1.3.2 Rounding off: The Standard Conventions

### 1. HOOK
When rounding off damage points in a video game, developers use specific conventions to keep calculations fair and unbiased!

### 2. PLAIN-LANGUAGE EXPLANATION
When rounding off to $n$ significant figures:
1. If the digit to be dropped is $>5$, raise the preceding digit by 1 (e.g., 2.746 becomes 2.75).
2. If the digit to be dropped is $<5$, leave it unchanged (e.g., 2.743 becomes 2.74).
3. If the digit to be dropped is exactly 5:
   - If the preceding digit is **even**, drop it (2.745 becomes 2.74).
   - If the preceding digit is **odd**, raise it by 1 (2.735 becomes 2.74).

### 3. TWO-LENS BREAKDOWN
📘 **CONCEPT LENS**: The odd/even rule for 5 avoids rounding bias in large datasets. If we always rounded 5 up, calculations would drift upwards.
📝 **EXAM LENS (JEE Main)**: The odd/even rule is a favorite for testing attention to detail. Remember: Odd-up, Even-drop!

### 4. VISUALIZE IT
A flowchart showing decisions based on whether the dropped digit is $>5$, $<5$, or $=5$, leading to the correct rounded output.

### 5. WORKED EXAMPLES
**Original JEE-Level Example:** Round off 3.14159 to 4 significant figures.
*Solution:* The 5th digit is 1 ($<5$). So, it rounds to 3.142 (preceding was 1, wait, 4th digit is 1, 5th is 5, preceding is odd, so it rounds up to 2). Thus, 3.142.

### 6. PRACTICE PROBLEMS
1. (Recall) Round off 2.745 and 2.735 to 3 significant figures.
2. (Apply) Express the speed of light 2.99792458 × 10⁸ m/s to 3 significant figures.
3. (Challenge) Solve and round off: $(2.54 \times 1.2) + 0.334$.

### 7. WATCH OUT
Only round off at the very end of multi-step calculations to prevent rounding errors from building up.

### 8. OPEN SCIENCE CORNER
Exact numbers in equations, like $2\pi$ in $T = 2\pi \sqrt{L/g}$, have infinite significant figures.

### 9. QUICK RECAP
- $>5$: Round up.
- $<5$: Leave unchanged.
- $=5$: Odd rounds up, Even drops.
