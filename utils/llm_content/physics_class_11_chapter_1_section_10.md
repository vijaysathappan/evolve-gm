# 1.6.2 Deducing Relations among Physical Quantities

### 1. HOOK
By understanding how air resistance, speed, and cross-sectional area are related, race car engineers can derive formula structures for drag using dimensions!

### 2. PLAIN-LANGUAGE EXPLANATION
If we know that a physical quantity depends on other quantities (up to three), we can write the relationship as a product type: $Q = k A^x B^y C^z$.
Equating dimensions on both sides allows us to solve for the exponents $x$, $y$, and $z$.
*Example:* Time period of a pendulum depends on length $l$, mass $m$, and gravity $g$.
$T = k l^x g^y m^z$
$[T] = [L]^x [L T^{-2}]^y [M]^z \implies x=\frac{1}{2}, y=-\frac{1}{2}, z=0$.
So, $T = k \sqrt{l/g}$.

### 3. TWO-LENS BREAKDOWN
📘 **CONCEPT LENS**: This method allows us to build physical relationships purely from scaling arguments.
📝 **EXAM LENS (JEE Main)**: This is one of the most common questions! You will be given a set of dependent variables and asked to find the formula. Remember: you cannot find the dimensionless constant $k$ (like $2\pi$) using this method.

### 4. VISUALIZE IT
A step-by-step assembly line showing raw variables ($l, g, m$) entering, dimensions being matched, and a completed formula exiting.

### 5. WORKED EXAMPLES
**Book Example 1.5:** Derive pendulum time period formula.
*Solution:* $T = k l^x g^y m^z$. Matching dimensions: $x+y=0$, $-2y=1$, $z=0 \implies x=1/2, y=-1/2, z=0$. Thus $T = k \sqrt{l/g}$. (Experimentally, $k=2\pi$).

### 6. PRACTICE PROBLEMS
1. (Recall) What are the limitations of deducing relations via dimensions?
2. (Apply) If force $F$ depends on mass $m$, velocity $v$, and radius $r$, derive the centrifugal force formula.
3. (Challenge) Derive a formula for velocity of sound $v$ depending on pressure $P$ and density $d$.

### 7. WATCH OUT
This method fails if the quantity depends on more than three variables, or if the formula involves addition/subtraction.

### 8. OPEN SCIENCE CORNER
Dimensional deduction is used in astrophysics to model the lifespan of stars before doing complex numerical integration.

### 9. QUICK RECAP
- Assume product dependency: $Q = k A^x B^y C^z$.
- Equate dimensions to solve for exponents.
- Cannot determine dimensionless constants.
