import math
import statistics
print("welcome to my program. It allows you to input a list of numbers and do calculation with them.pls enjoy")
print("Enter a list of numbers, type 0 when finished.")

numbers = []
number =  1

while number != 0:
    number = int(input("Enter any number: "))

    if number != 0:
        numbers.append(number)

sum_of_numbers = sum(numbers)
average_of_numbers = statistics.mean(numbers)
print()
print("here is the sum:",(sum_of_numbers))
print("here is the average:",(average_of_numbers))
print()
best_so_far = numbers[0]

for number in numbers:
    if number > best_so_far:
        best_so_far = number

print(f"The largest number is: {best_so_far}")

# Start by assuming the very first number in the list is the largest
least_so_far = numbers[0]

for number in numbers:
    if number < least_so_far:
        least_so_far = number

print(f"The smallest number is: {least_so_far}")
print()
sorted_numbers = sorted(numbers)
print("here are the numbers in a printed format:",(sorted_numbers))

print("hope you enjoyed using my program.")