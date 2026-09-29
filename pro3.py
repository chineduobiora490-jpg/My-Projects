print("🌌 WELCOME TO THE ECLIPSE STATION ADVENTURE! 🌌")
print("You wake up on a drifting neon space station. Alarms are blaring in pink light.")

# LEVEL 1
choice1 = input("Do you run to the ESCAPE pod, slide down the trash CHUTE, or explore the BRIDGE? ")
choice1 = choice1.upper() # Makes the choice work regardless of uppercase/lowercase

if choice1 == "ESCAPE":
    print("\nYou hop into a tiny escape pod, but the launch button is broken. You see wires sparking.")
    
    # LEVEL 2 (Branch A) - This level contains 3 choices for extra variety!
    choice2_a = input("Do you splice the RED wire, pull the BLUE lever, or SMASH the dashboard? ")
    choice2_a = choice2_a.upper()
    
    if choice2_a == "RED":
        print("\nThe pod powers up and shoots into hyperspace, but you land on a planet made entirely of cotton candy.")
        
        # LEVEL 3 (Branch A1)
        choice3_a1 = input("Do you EAT your way out, or try to DIG a tunnel? ")
        choice3_a1 = choice3_a1.upper()
        if choice3_a1 == "EAT":
            print("\nYou happily eat your way to freedom and become the ruler of the Candy Kingdom! YOU WIN! 👑")
        elif choice3_a1 == "DIG":
            print("\nThe sticky sugar traps you like quicksand. You are stuck here forever. GAME OVER! 🍭")
        else:
            print("\nInvalid choice! While you stood there doing nothing, a giant space ant ate your pod. GAME OVER!")
            
    elif choice2_a == "BLUE":
        print("\nThe lever activates a robot helper named Bob. Bob asks if you want to fly to Mars or Earth.")
        
        # LEVEL 3 (Branch A2)
        choice3_a2 = input("Do you choose MARS or EARTH? ")
        choice3_a2 = choice3_a2.upper()
        if choice3_a2 == "MARS":
            print("\nMars welcomes you with an alien parade! They give you a crown. YOU WIN! 👽")
        elif choice3_a2 == "EARTH":
            print("\nBob miscalculates and drops you directly into a traffic jam in 1998. GAME OVER! 🚗")
        else:
            print("\nInvalid choice! Bob gets confused by your response, malfunctions, and ejects you into space. GAME OVER!")
            
    elif choice2_a == "SMASH":
        print("\nYour fist breaks the glass! An emergency hologram of a space wizard appears.")
        
        # LEVEL 3 (Branch A3)
        choice3_a3 = input("Do you ask for a MAGIC spell, or a LASER blaster? ")
        choice3_a3 = choice3_a3.upper()
        if choice3_a3 == "MAGIC":
            print("\nThe wizard turns your pod into a flying dragon. You ride it to glory! YOU WIN! 🐉")
        elif choice3_a3 == "LASER":
            print("\nThe blaster targets the wrong wall, blows up your engine, and leaves you floating. GAME OVER! 💥")
        else:
            print("\nInvalid choice! The wizard disappears in disapproval. Your pod power runs out. GAME OVER!")
    else:
        print("\nInvalid choice! The pod explodes due to your hesitation. GAME OVER!")

elif choice1 == "CHUTE":
    print("\nYou slide down into a mountain of soft, glowing alien laundry. A fashionable space pirate confronts you.")
    
    # LEVEL 2 (Branch B)
    choice2_b = input("Do you COMPLIMENT her neon boots, or HIDE under a massive space sweater? ")
    choice2_b = choice2_b.upper()
    
    if choice2_b == "COMPLIMENT":
        print("\nShe loves your taste in fashion! She offers to make you her co-captain if you pass a test.")
        
        # LEVEL 3 (Branch B1)
        choice3_b1 = input("Do you steer the ship through an ASTEROID belt, or SING a sea shanty? ")
        choice3_b1 = choice3_b1.upper()
        if choice3_b1 == "ASTEROID":
            print("\nYou navigate the rocks perfectly! You are now the richest pirate in the galaxy. YOU WIN! 🏴‍☠️")
        elif choice3_b1 == "SING":
            print("\nYou sing completely out of tune. The pirates throw you overboard for hurting their ears. GAME OVER! 🎵")
        else:
            print("\nInvalid choice! The pirates grow impatient with your silence and lock you in the brig. GAME OVER!")
            
    elif choice2_b == "HIDE":
        print("\nYou hide, but the sweater belongs to a giant Cyber-Yeti who picks it up to wear it!")
        
        # LEVEL 3 (Branch B2)
        choice3_b2 = input("Do you TICKLE the Yeti's tummy, or SCREAM for help? ")
        choice3_b2 = choice3_b2.upper()
        if choice3_b2 == "TICKLE":
            print("\nThe Yeti giggles, becomes your best friend, and carries you safely to a luxury planet. YOU WIN! 🧸")
        elif choice3_b2 == "SCREAM":
            print("\nYour loud scream scares the Yeti. It drops you down an elevator shaft. GAME OVER! 🛗")
        else:
            print("\nInvalid choice! While you hesitated, the Yeti accidentally threw you into the space washing machine. GAME OVER!")
    else:
        print("\nInvalid choice! You trip on a stray boot and fall out an open airlock. GAME OVER!")

elif choice1 == "BRIDGE":
    print("\nYou enter the control bridge. A giant holographic cat is sitting on the self-destruct button.")
    
    # LEVEL 2 (Branch C)
    choice2_c = input("Do you offer the cat a holographic FISH, or try to MEOW at it? ")
    choice2_c = choice2_c.upper()
    
    if choice2_c == "FISH":
        print("\nThe cat happily chases the fish away from the button, revealing a hidden escape portal.")
        
        # LEVEL 3 (Branch C1)
        choice3_c1 = input("Do you JUMP into the portal, or stay to STEAL the cat? ")
        choice3_c1 = choice3_c1.upper()
        if choice3_c1 == "JUMP":
            print("\nThe portal takes you to a peaceful utopian paradise planet. YOU WIN! 🪐")
        elif choice3_c1 == "STEAL":
            print("\nThe holo-cat turns into a roaring lion scratch-bot. You get scratched out of existence. GAME OVER! 🦁")
        else:
            print("\nInvalid choice! The portal closes while you fumble, and the station blows up. GAME OVER!")
            
    elif choice2_c == "MEOW":
        print("\nThe cat finds your accent deeply offensive. It steps squarely on the self-destruct button!")
        
        # LEVEL 3 (Branch C2)
        choice3_c2 = input("Do you RUN for the nearest door, or ACCEPT your fate and dance? ")
        choice3_c2 = choice3_c2.upper()
        if choice3_c2 == "RUN":
            print("\nYou dive through the closing blast doors just in time, landing safely on a passing trade ship. YOU WIN! 🚀")
        elif choice3_c2 == "ACCEPT":
            print("\nYou bust out some terrible dance moves as the station explodes around you. Epic, but fatal. GAME OVER! 💃")
        else:
            print("\nInvalid choice! Standing frozen in fear, the explosion vaporizes the bridge. GAME OVER!")
    else:
        print("\nInvalid choice! The cat gets bored, bats you like a yarn ball, and knocks you out. GAME OVER!")
        
else:
    print("\nInvalid choice! You stood frozen in panic while the station spiraled into a black hole. GAME OVER! 🕳️")
