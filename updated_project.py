import math

# ==============================================================================
# W02 Project: Meal Price Calculator
# This program computes the subtotal, sales tax, and overall total for a group's
# meal bill. It also calculates a recommended tip and outputs the user's change.
# ==============================================================================

# --- Welcome Message & Creativity Requirement ---
print("hello user, welcome to my program")
print()
print("the purpose of this program is to demonstrate the capabilities of python in the calculations that follow")
print()

# --- Step 1: Prompt user for input data (Meal Prices & Quantities) ---
# Inputting meal prices as floating-point decimals for precision
child_meal_price = float(input("What is the price of a child's meal? "))
adult_meal_price = float(input("What is the price of an adult's meal? "))

# Inputting the number of people as integers since you cannot have a fraction of a person
num_children = int(input("How many children are there? "))
num_adults = int(input("How many adults are there? "))
print()

# --- Step 2: Compute and display the Subtotal ---
# Calculating the baseline subtotal before tax and tips
subtotal = (child_meal_price * num_children) + (adult_meal_price * num_adults)
print(f'Subtotal: ${subtotal:.2f}')
print()

# --- Step 3: Creativity Feature (Exceeds Requirements) ---
# Automatically calculating a suggested 15% tip option for the user
suggested_tip = subtotal * 0.15
print(f'Creativity Feature - Suggested 15% Tip: ${suggested_tip:.2f}')

# --- Step 4: Compute and display Sales Tax ---
# Inputting the sales tax percentage rate as a float
sales_tax_rate = float(input("What is the sales tax rate? "))
print()

# Converting percentage to decimal to find the exact tax amount
sales_tax = subtotal * (sales_tax_rate / 100)
print(f'Sales tax: ${sales_tax:.2f}')

# --- Step 5: Compute and display Total ---
# Combining the subtotal and sales tax for the final amount owed
total = sales_tax + subtotal
print(f'Total: ${total:.2f}')
print()

# --- Step 6: Payment and Change Handling ---
# Prompting the user for their cash payment amount
payment_amount = float(input("how much are you making as payment? "))
print()

# Deducting the total bill from the payment to find the remaining change owed
change = payment_amount - total
print(f'Your change is: ${change:.2f}')