# 1.6.1 Checking consistency: The Homogeneity Principle

### 1. HOOK
When tuning a car engine's displacement equations, checking the homogeneity of dimensions ensures that displacement matches volume dimensions!

### 2. PLAIN-LANGUAGE EXPLANATION
The **principle of homogeneity of dimensions** states that the dimensions of all terms in a physical equation must be the same.
Let's test: $x = x_0 + v_0 t + \frac{1}{2} a t^2$
- $[x] = [L]$
- $[x_0] = [L]$
- $[v_0 t] = [L T^{-1}] [T] = [L]$
- $[\frac{1}{2} a t^2] = [L T^{-2}] [T^2] = [L]$
All terms have the dimension $[L]$, so the equation is dimensionally correct.

### 3. TWO-LENS BREAKDOWN
📘 **CONCEPT LENS**: If an equation fails the homogeneity test, it is definitively wrong. If it passes, it is only *dimensionally correct*, not necessarily physically correct.
📝 **EXAM LENS (JEE Main)**: A common trick is to include logarithmic, trigonometric, or exponential functions. The arguments of these functions must always be **dimensionless** ($[M^0 L^0 T^0]$).

### 4. VISUALIZE IT
A horizontal equation where each term is highlighted in a box showing it resolves to $[L]$, proving dimensional homogeneity.

### 5. WORKED EXAMPLES
**Book Example 1.3:** Check consistency of $\frac{1}{2} m v^2 = m g h$.
*Solution:* 
- LHS: $[M] [L T^{-1}]^2 = [M L^2 T^{-2}]$
- RHS: $[M] [L T^{-2}] [L] = [M L^2 T^{-2}]$
LHS = RHS, so the equation is dimensionally correct.

### 6. PRACTICE PROBLEMS
1. (Recall) What does the principle of homogeneity state?
2. (Apply) Verify if $v^2 = u^2 + 2as$ is dimensionally correct.
3. (Challenge) In the equation $y = A \sin(k x - \omega t)$, prove that $k x$ and $\omega t$ are dimensionless.

### 7. WATCH OUT
Trigonometric arguments like $\theta$ in $\sin(\theta)$ have no dimensions.

### 8. OPEN SCIENCE CORNER
In quantum mechanics, equations like Schrödinger's wave equation are validated using dimensional homogeneity.

### 9. QUICK RECAP
- All terms in an equation must have the same dimensions.
- Trig, log, and exponential arguments are dimensionless.
