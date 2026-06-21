# 1.6 Dimensional Analysis: The Consistency Test

### 1. HOOK
Before running a heavy physics simulation in a game engine, developers use **dimensional analysis** to ensure the equations are completely correct!

### 2. PLAIN-LANGUAGE EXPLANATION
**Dimensional Analysis** is using dimensions to:
1. Check the consistency or homogeneity of mathematical expressions.
2. Deduce relations among physical quantities.
The fundamental rule is: *Only physical quantities with the same dimensions can be added or subtracted.*

### 3. TWO-LENS BREAKDOWN
📘 **CONCEPT LENS**: This is the principle of physical sanity. You cannot add a velocity to a force, just like you cannot add a lap time to a car's engine displacement!
📝 **EXAM LENS (JEE Main)**: Highly tested! Use this principle to rule out incorrect options in multiple-choice questions instantly without solving the entire sum.

### 4. VISUALIZE IT
A gatekeeper checklist showing that if LHS dimensions do not equal RHS dimensions, the formula is immediately blocked and marked wrong.

### 5. WORKED EXAMPLES
**Book Example 1.4:** Rule out incorrect kinetic energy ($K$) formulas:
(a) $K = m^2 v^3$
(b) $K = \frac{1}{2}mv^2$
(c) $K = ma$
(d) $K = \frac{3}{16}mv^2$
(e) $K = \frac{1}{2}mv^2 + ma$
*Solution:* $K$ has dimensions $[M L^2 T^{-2}]$. 
(a) $[M^2 L^3 T^{-3}]$ (Incorrect)
(b) $[M L^2 T^{-2}]$ (Correct)
(c) $[M L T^{-2}]$ (Incorrect)
(d) $[M L^2 T^{-2}]$ (Correct)
(e) Adds terms of different dimensions (Incorrect).
Hence, (a), (c), and (e) are ruled out.

### 6. PRACTICE PROBLEMS
1. (Recall) What is the main rule for adding two physical quantities?
2. (Apply) Check if $E = mc^2$ is dimensionally consistent (where $E$ is energy, $m$ is mass, $c$ is speed).
3. (Challenge) Explain why dimensional arguments cannot distinguish between formulas (b) and (d) in Example 1.4.

### 7. WATCH OUT
Dimensional analysis can prove a formula is *wrong*, but it cannot prove a formula is *right* because it cannot check numerical constants.

### 8. OPEN SCIENCE CORNER
Dimensional homogeneity is the foundation of scale-model testing, like testing miniature model racing cars in wind tunnels.

### 9. QUICK RECAP
- Only add/subtract same dimensions.
- LHS dimensions must equal RHS dimensions.
