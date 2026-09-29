print("hello there,user!")
print("welcome to clever stories. this program takes your custom words and compiles them into a funny and amusing story. now have fun!")
print()# Adds a clean blank line before prompts begin
print(" help out with a few words to make your story")
#this section of the code is meant to help you understand what to do to make your own story.
#now help out with some words.
#enter a verb,noun,adjective and an exclamation when prompted to do so.


#user interation section of the code begins here
adjective = input("choose a random adjective e.g. happy,sad or perhaps even angry: ")
animal = input("choose a random animal e.g. dog,cat or even a bird: ")
verb = input("choose a random verb e.g. run,walk or maybe jump: ")
exclamation = input("a random exclamation?, e.g wow,oh no or maybe even yikes: ")
verb_1 = input("choose a random verb,something creative in mind: ")
verb_2 = input("choose a random verb. think hard for a verb that goes along: ")
adjective_1 = input("choose a random adjective. e.g. amazed or amused: ")
verb_3 = input("choose a random verb. keep the structure of the story in mind: ")
capitalized_exclamation = exclamation.capitalize()
print("here you go! your story is ready!")
print()# Adds a clean blank line before prompts begin


#finished result here.enjoy
print(f"The other day, I was really in trouble. It all started when I saw a very {adjective} {animal} {verb} down the hallway. \"{capitalized_exclamation}!\" I yelled. But all I could think to do was to {verb_1} over and over. Miraculously, that caused it to stop, but not before it tried to {verb_2} right in front of my family. I was so {adjective_1} that I wanted to {verb_3} all the way home.")
print()# Adds a clean blank line before prompts begin
print("hope you enjoyed your story! if you want to make another story just run the program again!")
