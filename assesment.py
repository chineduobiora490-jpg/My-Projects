import math
with open("hr_system.txt") as file:
    next(file)
    for line in file:  # <--- This loop moves from line to line
        clean_line = line.strip()
        parts = clean_line.split(" ")
        
        name = parts[0]
        id = parts[1]
        title = parts[2]
        salary = float(parts[3])

        actual_salary = salary/24
        if title.lower() == "engineer":
            actual_salary += 1000

        # Output the data as desired
        print(f"{name} (ID: {id}), {title} - ${actual_salary:.2f}")