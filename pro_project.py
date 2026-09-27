# CREATIVITY STATEMENT: This program implements an arcade-style "Energy Limit" mechanics system.
# The player starts with 7 energy bars, losing 1 per valid or invalid guess, adding suspense to survival.

secret_word = "shovel"
guess_count = 0

# Creative Element: Added a maximum guess limit (Energy Bars) to increase game difficulty
energy_bars = 7

print("Welcome to the word guessing game!")
print(f"Danger! You only have {energy_bars} energy bars remaining before system shutdown.")
print()

# Requirement 1: Use a loop to generate the initial hint
initial_hint = ""
for i in range(len(secret_word)):
    initial_hint += "_ "
print("Your hint is:", initial_hint)
print()

playing = True
while playing:
    # Check if the player ran out of energy bars (Creative Limit)
    if energy_bars <= 0:
        print("💥 GAME OVER: System shutdown! You ran out of energy bars.")
        print(f"The secret word was: {secret_word}")
        playing = False
        continue

    guess = input("What is your guess? ")
    guess = guess.lower()
    guess_count = guess_count + 1
    energy_bars = energy_bars - 1 # Lose an energy bar with every attempt
    
    # Requirement 2: Check to verify that the length of the guess is the same
    if len(guess) != len(secret_word):
        print("Sorry, the guess must have the same number of letters as the secret word.")
        print(f"⚡ Energy Warning: Invalid input! Energy bars remaining: {energy_bars}")
        print()
        continue
        
    # Requirement 3: Check victory condition
    if guess == secret_word:
        print("Congratulations! You guessed it!")
        print(f"It took you {guess_count} guesses.")
        playing = False
    else:
        # Requirement 4 & 5: Add hints according to the lowercase/uppercase rules with trailing spaces
        hint = ""
        for i in range(len(secret_word)):
            letter = guess[i]
            
            if letter == secret_word[i]:
                # Exact spot match -> Uppercase
                hint += letter.upper() + " "
            elif letter in secret_word:
                # Present but wrong spot -> Lowercase
                hint += letter.lower() + " "
            else:
                # Not present at all -> Underscore
                hint += "_ "
                
        print("Your hint is:", hint)
        print(f"⚡ Energy bars remaining: {energy_bars}")
        print()
