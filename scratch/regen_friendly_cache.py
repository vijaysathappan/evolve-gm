import os
import json

CACHE_DIR = "C:/Projects/evolve-gm/utils/llm_content"
os.makedirs(CACHE_DIR, exist_ok=True)

# All 13 sections with FRIENDLY, SPEECH-SAFE English explanations.
# Rules applied:
# - No LaTeX, no $...$ notation, no [M^0] style brackets.
# - All math written as spoken words.
# - Tone: casual friend explaining to friend.
# - Analogies: cricket, gaming, cars, everyday tech.

SECTIONS = {
    0: [
        {
            "paragraph": "Measurement of any physical quantity involves comparison with a certain basic, arbitrarily chosen, internationally accepted reference standard called unit. The result of a measurement of a physical quantity is expressed by a number (or numerical measure) accompanied by a unit. Although the number of physical quantities appears to be very large, we need only a limited number of units for expressing all the physical quantities, since they are inter-related with one another. The units for the fundamental or base quantities are called fundamental or base units. The units of all other physical quantities can be expressed as combinations of the base units. Such units obtained for the derived quantities are called derived units. A complete set of these units, both the base units and derived units, is known as the system of units.",
            "explanation": "Okay so think about this — when you say a cricket pitch is 22 yards long, what you're really saying is that you compared its length to something everyone agreed on: the yard. That agreed-upon reference is called a unit. Every single measurement in physics works the same way — you have a number and a unit together, like 100 kilometers per hour or 9.8 meters per second squared. Now here's the cool part — even though there are thousands of physical quantities in physics, we don't need thousands of different units. We only need a small set of base or fundamental units, because everything else can be built from them. Think of it like ingredients in cooking — with just flour, sugar, eggs, and butter, you can make hundreds of different dishes. Similarly, base units like length, mass, and time combine to create derived units for things like speed, force, and energy. The entire organized collection of base units plus derived units is called a system of units."
        }
    ],
    1: [
        {
            "paragraph": "In earlier time scientists of different countries were using different systems of units for measurement. Three such systems, the CGS, the FPS (or British) system and the MKS system were in use extensively till recently.",
            "explanation": "Imagine if different gaming platforms used completely incompatible save files — PlayStation players couldn't share data with Xbox players, and everything would be a mess. That was exactly the problem in early science. Different countries used totally different unit systems. The CGS system used centimetres for length, grams for mass, and seconds for time. The FPS system — used mostly in Britain and America — used feet, pounds, and seconds. And the MKS system used metres, kilograms, and seconds. Scientists were constantly struggling to convert between them, like trying to convert miles to kilometres when you switch from an American road trip app to a European one."
        },
        {
            "paragraph": "The system of units which is at present internationally accepted for measurement is the Système Internationale d' Unites (French for International System of Units), abbreviated as SI. The SI, with standard scheme of symbols, units and abbreviations, developed by the Bureau International des Poids et measures (The International Bureau of Weights and Measures, BIPM) in 1971 were recently revised by the General Conference on Weights and Measures in November 2018.",
            "explanation": "To solve that chaos, the world finally agreed on one universal system — the SI system, which stands for International System of Units in French. Think of it like the FIFA deciding on one set of official football rules so that a match in Brazil follows the same rules as one in Germany. The SI system was developed by an international organization called the BIPM back in 1971. And just like how apps get software updates, the SI system got a major update in November 2018, where some unit definitions were made even more precise and tied to fundamental constants of nature instead of physical objects."
        }
    ],
    2: [
        {
            "paragraph": "As discussed above, every measurement involves errors. Thus, the result of measurement should be reported in a way that indicates the precision of measurement. Normally, the reported result of measurement is a number that includes all digits in the number that are known reliably plus the first digit that is uncertain. The reliable digits plus the first uncertain digit are known as significant digits or significant figures.",
            "explanation": "Okay so here is the thing about measurements — no instrument is perfect. There's always a tiny bit of uncertainty. Significant figures are basically the honest way of reporting a measurement, where you include all the digits you are really sure about, plus one last digit that you are estimating. For example, if a stopwatch shows 12.6 seconds, that means the 1 and the 2 are certain, but the 6 might be slightly off. So this reading has three significant figures. It's like in cricket statistics — you can be confident about the runs scored, but the exact strike rate might have some rounding involved depending on how precisely the balls were counted."
        }
    ],
    3: [
        {
            "paragraph": "In multiplication or division, the final result should retain as many significant figures as are there in the original number with the least significant figures. In addition or subtraction, the final result should retain as many decimal places as are there in the number with the least decimal places.",
            "explanation": "Think of it this way — if your friend gives you an approximate speed and you multiply it by time to get distance, your answer can't magically be more precise than the original rough speed. That is the whole point of these rules. For multiplication and division, your answer keeps the same number of significant figures as the least precise input. So if one number has 3 significant figures and another has 5, your answer only gets 3. For addition and subtraction, you look at decimal places instead. If you add 12.9 and 7.06, the answer must stop at one decimal place because 12.9 only has one. You can't pretend you have more precision than your data actually gives you."
        }
    ],
    4: [
        {
            "paragraph": "The rule by convention is that the preceding digit is raised by 1 if the insignificant digit to be dropped is more than 5, and is left unchanged if the latter is less than 5. But what if the number is 2.745 in which the insignificant digit is 5. Here, the convention is that if the preceding digit is even, the insignificant digit is simply dropped and, if it is odd, the preceding digit is raised by 1.",
            "explanation": "Rounding sounds simple but there is one tricky situation that trips everyone up — what do you do when the dropped digit is exactly 5? If it is more than 5, you round up — straightforward. If it is less than 5, you leave it alone — also straightforward. But when it is exactly 5, here is the neat trick: look at the digit just before it. If that digit is even, you drop the 5 and leave it as is. If that digit is odd, you round it up by one. So 2.745 rounds to 2.74 because 4 is even. And 2.735 rounds to 2.74 because 3 is odd. This even-odd rule prevents any systematic bias in large calculations — it is like the referee calling fair coin flips to keep things balanced across many rounds."
        }
    ],
    5: [
        {
            "paragraph": "The relative error of a value of number specified to significant figures depends not only on n but also on the number itself. For example, the accuracy in measurement of mass 1.02 g is ± 0.01 g whereas another measurement 9.89 g is also accurate to ± 0.01 g.",
            "explanation": "Here is something really interesting — even if two measurements have the same absolute error, they are not equally precise in relative terms. Imagine you are racing cars and your GPS has an error of plus or minus 1 metre. If the race is only 10 metres long, that 1 metre error is huge — it is 10 percent of the total. But if the race is 1000 metres, that same 1 metre error is only 0.1 percent. Same absolute error, totally different relative impact. That is exactly what is happening here. A mass measurement of 1.02 grams with an error of 0.01 grams has a relative error of about 1 percent. But a measurement of 9.89 grams with the same 0.01 gram error has a relative error of only about 0.1 percent. So larger values generally give smaller relative errors."
        }
    ],
    6: [
        {
            "paragraph": "The nature of a physical quantity is described by its dimensions. All the physical quantities represented by derived units can be expressed in terms of some combination of seven fundamental or base quantities. We shall call these base quantities as the seven dimensions of the physical world, which are denoted with square brackets.",
            "explanation": "Think of dimensions as the DNA of a physical quantity. Just like every living organism is built from the same fundamental base pairs of DNA, every physical quantity in physics is built from just seven fundamental dimensions — Mass, Length, Time, Electric Current, Temperature, Amount of Substance, and Luminous Intensity. These are the absolute building blocks. When we write dimensions, we use square bracket notation to show what a quantity is made of. It is like writing the ingredients list on the back of a food product — it tells you exactly what is in it at the most fundamental level."
        },
        {
            "paragraph": "For example, the volume occupied by an object is expressed as the product of length, breadth and height, or three lengths. Hence the dimensions of volume are [L] × [L] × [L] = [L]3 = [L3]. As the volume is independent of mass and time, it is said to possess zero dimension in mass [M°], zero dimension in time [T°] and three dimensions in length.",
            "explanation": "Let us work through volume as a concrete example. Volume equals length times breadth times height, right? Each of those three quantities is a length. So when you write out the dimensions, you get L times L times L, which equals L cubed. Since volume has nothing to do with mass or time, we say it has zero dimensions in mass and zero dimensions in time. The full formal way to write it is M to the power zero, L to the power three, T to the power zero — which just means mass does not appear, length appears three times, and time does not appear. It is like saying a pizza has zero fish, three layers of cheese, and zero chocolate — you are describing exactly what is in it."
        }
    ],
    7: [
        {
            "paragraph": "The expression which shows how and which of the base quantities represent the dimensions of a physical quantity is called the dimensional formula of the given physical quantity. An equation obtained by equating a physical quantity with its dimensional formula is called the dimensional equation of the physical quantity.",
            "explanation": "So a dimensional formula is basically the shorthand recipe that tells you what base quantities make up a physical quantity and in what power. For example, force has a dimensional formula of M to the power 1, L to the power 1, T to the power minus 2 — meaning it involves mass to the first power, length to the first power, and time to the inverse second power. When you write an equation saying that force equals M L T to the minus 2, that is called a dimensional equation. Think of it like writing out the source code for a physical quantity — it tells you exactly how it is composed from the most fundamental ingredients."
        }
    ],
    8: [
        {
            "paragraph": "The recognition of concepts of dimensions, which guide the description of physical behaviour is of basic importance as only those physical quantities can be added or subtracted which have the same dimensions. A thorough understanding of dimensional analysis helps us in deducing certain relations among different physical quantities and checking the derivation, accuracy and dimensional consistency or homogeneity of various mathematical expressions.",
            "explanation": "Here is a super powerful idea — you can only add or subtract things that are the same type of thing. You cannot add your speed to your weight, right? That makes no physical sense. In physics, this translates to: only quantities with the same dimensions can be added or subtracted. Speed has dimensions of L divided by T, and force has dimensions of M times L divided by T squared — you absolutely cannot add these two. This principle is called dimensional analysis, and it is like a spell-checker for physics equations. If an equation tries to add quantities with different dimensions, you know instantly it is wrong. You can also use it to figure out what form an equation should take, which is incredibly useful in exams."
        }
    ],
    9: [
        {
            "paragraph": "The magnitudes of physical quantities may be added together or subtracted from one another only if they have the same dimensions. In other words, we can add or subtract similar physical quantities. Thus, velocity cannot be added to force, or an electric current cannot be subtracted from the thermodynamic temperature. This simple principle called the principle of homogeneity of dimensions in an equation is extremely useful in checking the correctness of an equation.",
            "explanation": "The principle of homogeneity is basically saying every term in a physics equation must be measuring the same type of thing. Think of it like currency exchange — you cannot simply add 100 rupees to 100 dollars without converting them first, because they represent different things in different scales. Similarly, in a physics equation like distance equals initial velocity times time plus half times acceleration times time squared, every single term on both sides of the equation must work out to have the dimension of length. If even one term comes out to a different dimension, the whole equation is wrong. This is your fastest fact-checking tool — use it in exams to eliminate wrong answer options in seconds."
        }
    ],
    10: [
        {
            "paragraph": "The method of dimensions can sometimes be used to deduce relation among the physical quantities. For this we should know the dependence of the physical quantity on other quantities (upto three physical quantities or linearly independent variables) and consider it as a product type of the dependence.",
            "explanation": "Now here is one of the coolest tricks in all of physics — you can sometimes figure out what a formula should look like just by thinking about dimensions, even without doing any experiment. The idea is: if you know that some quantity depends on a few other quantities, you assume the relationship is a product — something like Q equals k times A to the power x, times B to the power y, times C to the power z. Then you write out the dimensions of both sides and solve for x, y, and z. It is like being a detective where the only clues you have are what type of quantities are involved, and you deduce the formula from those clues alone. The limitation is that this method cannot tell you the exact numerical constant k — for that you need an experiment. But getting the structure of the formula is already a huge win."
        }
    ],
    11: [
        {
            "paragraph": "Physics is a quantitative science, based on measurement of physical quantities. Certain physical quantities have been chosen as fundamental or base quantities (such as length, mass, time, electric current, thermodynamic temperature, amount of substance, and luminous intensity).",
            "explanation": "And that brings us full circle to the big picture — physics is fundamentally about measuring things precisely. The seven base quantities — length, mass, time, electric current, thermodynamic temperature, amount of substance, and luminous intensity — are like the seven notes in music. Every song, every chord, every symphony is built from those seven notes. In the same way, every physical quantity you will ever encounter in science is built from these seven fundamental base quantities. Knowing them and how they combine gives you an incredibly powerful framework for understanding the entire physical world."
        }
    ],
    12: [
        {
            "paragraph": "Note : In stating numerical answers, take care of significant figures.",
            "explanation": "And one last thing before you dive into the exercises — always pay attention to significant figures when you write your final answer. This is one of those small habits that separates students who get full marks from those who lose easy marks on small mistakes. If the data in a problem has three significant figures, your answer should also have three significant figures. Not two, not five — three. It is a way of being honest about how precise your answer actually is, and it shows the examiner that you understand the concept and are not just plugging numbers into a formula. Treat it like the final polish before submitting your best work."
        }
    ]
}


def save_section(idx, data):
    fname = f"physics_class_11_chapter_1_section_{idx}.json"
    fpath = os.path.join(CACHE_DIR, fname)
    with open(fpath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  Saved: {fname}  ({len(data)} paragraphs)")


print("Regenerating all section cache files with friendly speech-safe English...\n")
for idx, data in SECTIONS.items():
    save_section(idx, data)

print(f"\nDone! {len(SECTIONS)} sections saved to {CACHE_DIR}")
