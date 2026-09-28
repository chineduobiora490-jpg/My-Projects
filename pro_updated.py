print("Welcome to the Shopping Cart Program!")

items = []
prices = []
action = 0

while action != 5:
    print("\nPlease select one of the following: ")
    print("1. Add item")
    print("2. View cart")
    print("3. Remove item")
    print("4. Compute total")
    print("5. Quit")
    
    action = int(input("Please enter an action: "))

    if action == 1:
        new_item = input("What item would you like to add? ")
        new_price = float(input(f"What is the price of '{new_item}'? "))
        items.append(new_item)
        prices.append(new_price)
        print(f"'{new_item}' has been added to the cart.")

    elif action == 2:
        print("The contents of the shopping cart are:")
        for i in range(len(items)):
            print(f"{i + 1}. {items[i]} - ${prices[i]:.2f}")

    elif action == 3:
        print("The contents of the shopping cart are:")
        for i in range(len(items)):
            print(f"{i + 1}. {items[i]} - ${prices[i]:.2f}")
        
        index = int(input("Which item would you like to remove? "))
        items.pop(index - 1)
        prices.pop(index - 1)
        print("Item removed.")

    elif action == 4:
        total = sum(prices)
        print(f"The total price of the items in the shopping cart is ${total:.2f}")

    elif action == 5:
        print("Thank you. Goodbye.")
