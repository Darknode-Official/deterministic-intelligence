// Curated syntax reference for the offline Q&A engine.
// Answers questions like "for loop in java" or "try catch in python".
// SYNTAX[construct][lang] = [code, note]. No runtime dependencies.

export const SYNTAX_LANGS = {
  python: "Python",
  javascript: "JavaScript",
  typescript: "TypeScript",
  java: "Java",
  c: "C",
  cpp: "C++",
  csharp: "C#",
  go: "Go",
  rust: "Rust",
  ruby: "Ruby",
  php: "PHP",
  swift: "Swift",
  kotlin: "Kotlin",
  bash: "Bash",
};

export const LANG_ALIAS = {
  "py": "python",
  "python3": "python",
  "python 3": "python",
  "py3": "python",
  "js": "javascript",
  "node": "javascript",
  "nodejs": "javascript",
  "node.js": "javascript",
  "ecmascript": "javascript",
  "es6": "javascript",
  "vanilla js": "javascript",
  "ts": "typescript",
  "jdk": "java",
  "ansi c": "c",
  "c language": "c",
  "clang": "c",
  "c++": "cpp",
  "cplusplus": "cpp",
  "c plus plus": "cpp",
  "cxx": "cpp",
  "c#": "csharp",
  "c sharp": "csharp",
  "cs": "csharp",
  "dotnet": "csharp",
  ".net": "csharp",
  "golang": "go",
  "rs": "rust",
  "rustlang": "rust",
  "rb": "ruby",
  "php8": "php",
  "swiftlang": "swift",
  "kt": "kotlin",
  "kts": "kotlin",
  "shell": "bash",
  "sh": "bash",
  "shell script": "bash",
  "bash script": "bash",
  "terminal": "bash",
  "linux shell": "bash",
};

export const CONSTRUCTS = {
  "for loop": {
    title: "For loop",
    words: ["for each loop", "foreach loop", "for-each loop", "for in loop", "for of loop", "range based for", "range-based for", "loop through a list", "loop through an array", "loop through", "loop over", "iterate over", "iterate through", "for loop", "for-loop", "for each", "foreach", "iterate", "loop"],
  },
  "while loop": {
    title: "While loop",
    words: ["do while loop", "do-while loop", "while loop", "while-loop", "do while", "do-while", "repeat until", "loop until", "infinite loop", "while true", "while"],
  },
  "if else": {
    title: "If / else",
    words: ["if else if", "if-else-if", "if elif else", "else if", "if else", "if-else", "if/else", "if statement", "if condition", "conditional statement", "conditional statements", "conditionals", "conditional", "ternary operator", "ternary", "elif", "elsif", "elseif"],
  },
  "switch": {
    title: "Switch / match",
    words: ["switch case statement", "switch statement", "switch case", "switch-case", "match case", "match statement", "match expression", "pattern matching", "case statement", "when expression", "case when", "case esac", "switch", "match", "when"],
  },
  "function": {
    title: "Function",
    words: ["define a function", "declare a function", "create a function", "write a function", "make a function", "define function", "declare function", "create function", "function definition", "function declaration", "user defined function", "return a value", "return value", "functions", "function", "method", "subroutine", "procedure", "def", "func", "fn"],
  },
  "class": {
    title: "Class",
    words: ["create a class", "define a class", "declare a class", "make a class", "write a class", "class definition", "class declaration", "object oriented programming", "object oriented", "oop", "constructor", "classes", "class", "struct"],
  },
  "list": {
    title: "List / array",
    words: ["dynamic array", "array list", "arraylist", "create an array", "create a list", "declare an array", "make an array", "make a list", "append to a list", "append to list", "append to an array", "append to array", "add to a list", "add to list", "add to array", "push to array", "array length", "list length", "length of array", "length of list", "size of array", "index an array", "arrays", "lists", "array", "list", "vector", "slice", "append", "push"],
  },
  "dictionary": {
    title: "Dictionary / map",
    words: ["associative array", "hash map", "hashmap", "hash table", "hashtable", "key value pairs", "key-value pairs", "key value pair", "key value", "key-value", "iterate over dictionary", "loop through dictionary", "iterate over map", "dictionary", "dictionaries", "dict", "map", "hash", "object literal"],
  },
  "string formatting": {
    title: "String concatenation and formatting",
    words: ["string concatenation", "concatenate strings", "concatenate two strings", "concatenating strings", "join two strings", "combine strings", "string interpolation", "string formatting", "format a string", "format string", "format strings", "formatted string", "template literals", "template literal", "template string", "f-strings", "f-string", "f string", "fstring", "sprintf", "string format", "interpolation", "concatenate", "concatenation", "concat"],
  },
  "print": {
    title: "Print / output",
    words: ["print to the console", "print to console", "print to screen", "print output", "print a line", "print text", "print a variable", "console output", "write to console", "log to console", "display text", "console.log", "system.out.println", "println", "printf", "print", "echo", "cout", "puts", "output"],
  },
  "comment": {
    title: "Comments",
    words: ["multi-line comment", "multiline comment", "multi line comment", "block comment", "single-line comment", "single line comment", "line comment", "comment out code", "comment out", "doc comment", "docstring", "comments", "comment"],
  },
  "read input": {
    title: "Read user input",
    words: ["read user input", "get user input", "take user input", "ask the user for input", "ask user for input", "read input from user", "read input from the user", "input from user", "input from keyboard", "keyboard input", "read from stdin", "read from standard input", "read a line from the user", "read line", "readline", "take input", "user input", "read input", "prompt user", "scanner", "stdin", "input"],
  },
  "try catch": {
    title: "Try / catch (error handling)",
    words: ["try catch finally", "try catch", "try-catch", "try/catch", "try except", "try-except", "try/except", "exception handling", "error handling", "handle errors", "handle an error", "handle exceptions", "handle an exception", "catch an exception", "catch exception", "catch error", "throw an exception", "throw exception", "throw an error", "raise an exception", "raise exception", "raise an error", "begin rescue", "exceptions", "exception", "errors", "rescue", "throw", "raise", "try"],
  },
  "import": {
    title: "Import / include",
    words: ["import a module", "import a library", "import a package", "import module", "import library", "import package", "import a file", "include a header", "include header", "include a file", "import statement", "using directive", "use statement", "require a file", "imports", "import", "include", "require", "modules", "libraries"],
  },
  "read file": {
    title: "Read a file",
    words: ["read a file line by line", "read file line by line", "read lines from a file", "read lines from file", "read a text file", "read text file", "read from a file", "read from file", "read the file", "read a file", "read file", "open a file", "open file", "load a file", "load file", "file input", "file reading", "file read", "fopen", "fgets", "ifstream"],
  },
  "write file": {
    title: "Write a file",
    words: ["write text to a file", "write to a file", "write to file", "write a file", "write file", "save to a file", "save to file", "save a file", "save file", "append to a file", "append to file", "create a file", "create file", "file output", "file writing", "file write", "ofstream", "fprintf"],
  },
  "sort": {
    title: "Sort a list / array",
    words: ["sort a list", "sort an array", "sort a vector", "sort a slice", "sort list", "sort array", "sort a dictionary", "sort in descending order", "sort descending", "sort ascending", "reverse sort", "sort numbers", "sort strings", "sort by key", "custom sort", "sorting", "sorted", "sort", "order by", "qsort"],
  },
  "string length": {
    title: "String length",
    words: ["length of a string", "length of string", "string length", "size of a string", "size of string", "string size", "len of a string", "len of string", "count characters in a string", "count characters", "number of characters", "how many characters", "strlen", "string len"],
  },
  "string to int": {
    title: "Convert string to integer",
    words: ["convert a string to an integer", "convert string to integer", "convert string to int", "convert a string to a number", "convert string to number", "string to integer", "string to int", "string to number", "str to int", "text to number", "parse an integer", "parse integer", "parse int", "parseint", "parse a number", "parse number", "convert to integer", "convert to int", "convert to number", "cast to int", "cast string to int", "to int", "atoi", "stoi", "strtol"],
  },
  "random number": {
    title: "Random number",
    words: ["generate a random number", "generate random number", "random number between", "random number", "random integer", "random int", "random float", "random decimal", "random element", "random choice", "pick a random item", "random item", "shuffle", "randint", "rand", "random"],
  },
  "lambda": {
    title: "Lambda / anonymous function",
    words: ["anonymous function", "lambda expression", "lambda function", "arrow function", "inline function", "function literal", "function expression", "closures", "closure", "lambdas", "lambda"],
  },
  "main function": {
    title: "Main function / entry point",
    words: ["main function", "main method", "entry point", "program entry point", "program entry", "start of program", "if __name__ == \"__main__\"", "if __name__", "__main__", "public static void main", "int main", "func main", "fn main", "main()", "main"],
  },
  "hello world": {
    title: "Hello, World!",
    words: ["hello world program", "hello world", "hello, world", "hello-world", "helloworld", "first program", "simplest program", "basic program"],
  },
};

export const SYNTAX = {
  "for loop": {
    python: [
      "for i in range(5):\n    print(i)\n\n# over a list\nfor item in items:\n    print(item)\n\n# with the index\nfor index, item in enumerate(items):\n    print(index, item)",
      "range(5) gives 0 to 4; range(start, stop, step) is also available.",
    ],
    javascript: [
      "for (let i = 0; i < 5; i++) {\n  console.log(i);\n}\n\n// over an array's values\nfor (const item of items) {\n  console.log(item);\n}",
      "for...of iterates values; for...in iterates object keys.",
    ],
    typescript: [
      "for (let i = 0; i < 5; i++) {\n  console.log(i);\n}\n\n// over an array's values\nconst items: string[] = [\"a\", \"b\", \"c\"];\nfor (const item of items) {\n  console.log(item);\n}",
      "for...of iterates values; for...in iterates object keys.",
    ],
    java: [
      "for (int i = 0; i < 5; i++) {\n    System.out.println(i);\n}\n\n// over an array or collection\nfor (String item : items) {\n    System.out.println(item);\n}",
      "",
    ],
    c: [
      "for (int i = 0; i < 5; i++) {\n    printf(\"%d\\n\", i);\n}\n\n// over an array\nint nums[] = {1, 2, 3};\nsize_t n = sizeof nums / sizeof nums[0];\nfor (size_t i = 0; i < n; i++) {\n    printf(\"%d\\n\", nums[i]);\n}",
      "Declaring the variable inside for needs C99 or later.",
    ],
    cpp: [
      "for (int i = 0; i < 5; i++) {\n    std::cout << i << '\\n';\n}\n\n// range-based for over a container\nstd::vector<std::string> items = {\"a\", \"b\", \"c\"};\nfor (const auto& item : items) {\n    std::cout << item << '\\n';\n}",
      "",
    ],
    csharp: [
      "for (int i = 0; i < 5; i++)\n{\n    Console.WriteLine(i);\n}\n\n// over an array or collection\nforeach (var item in items)\n{\n    Console.WriteLine(item);\n}",
      "",
    ],
    go: [
      "for i := 0; i < 5; i++ {\n    fmt.Println(i)\n}\n\n// over a slice\nfor index, item := range items {\n    fmt.Println(index, item)\n}",
      "Go 1.22+ also allows: for i := range 5 { ... }. Use _ to ignore the index.",
    ],
    rust: [
      "for i in 0..5 {\n    println!(\"{i}\");\n}\n\n// over a vector (borrowed)\nfor item in &items {\n    println!(\"{item}\");\n}\n\n// with the index\nfor (index, item) in items.iter().enumerate() {\n    println!(\"{index}: {item}\");\n}",
      "0..5 excludes 5; 0..=5 includes it.",
    ],
    ruby: [
      "5.times do |i|\n  puts i\nend\n\n# over an array\nitems.each do |item|\n  puts item\nend\n\n# with the index\nitems.each_with_index do |item, index|\n  puts \"#{index}: #{item}\"\nend",
      "Ruby has for i in 0...5, but each/times is the idiomatic style.",
    ],
    php: [
      "for ($i = 0; $i < 5; $i++) {\n    echo $i, PHP_EOL;\n}\n\n// over an array\nforeach ($items as $item) {\n    echo $item, PHP_EOL;\n}\n\n// with keys\nforeach ($items as $key => $value) {\n    echo \"$key: $value\", PHP_EOL;\n}",
      "",
    ],
    swift: [
      "for i in 0..<5 {\n    print(i)\n}\n\n// over an array\nfor item in items {\n    print(item)\n}\n\n// with the index\nfor (index, item) in items.enumerated() {\n    print(index, item)\n}",
      "0..<5 excludes 5; 0...5 includes it.",
    ],
    kotlin: [
      "for (i in 0 until 5) {\n    println(i)\n}\n\n// over a list\nfor (item in items) {\n    println(item)\n}\n\n// with the index\nfor ((index, item) in items.withIndex()) {\n    println(\"$index: $item\")\n}",
      "0 until 5 excludes 5; 0..5 includes it; 5 downTo 0 counts down.",
    ],
    bash: [
      "for i in {0..4}; do\n    echo \"$i\"\ndone\n\n# C-style\nfor ((i = 0; i < 5; i++)); do\n    echo \"$i\"\ndone\n\n# over an array\nfor item in \"${items[@]}\"; do\n    echo \"$item\"\ndone",
      "Quote \"${items[@]}\" so elements containing spaces stay intact.",
    ],
  },
  "while loop": {
    python: [
      "count = 0\nwhile count < 5:\n    print(count)\n    count += 1\n\n# infinite loop with break\nwhile True:\n    line = input()\n    if line == \"quit\":\n        break",
      "Python has no do-while; use while True with break.",
    ],
    javascript: [
      "let count = 0;\nwhile (count < 5) {\n  console.log(count);\n  count++;\n}\n\n// do-while runs the body at least once\ndo {\n  count--;\n} while (count > 0);",
      "",
    ],
    typescript: [
      "let count = 0;\nwhile (count < 5) {\n  console.log(count);\n  count++;\n}\n\n// do-while runs the body at least once\ndo {\n  count--;\n} while (count > 0);",
      "",
    ],
    java: [
      "int count = 0;\nwhile (count < 5) {\n    System.out.println(count);\n    count++;\n}\n\n// do-while runs the body at least once\ndo {\n    count--;\n} while (count > 0);",
      "",
    ],
    c: [
      "int count = 0;\nwhile (count < 5) {\n    printf(\"%d\\n\", count);\n    count++;\n}\n\n// do-while runs the body at least once\ndo {\n    count--;\n} while (count > 0);",
      "",
    ],
    cpp: [
      "int count = 0;\nwhile (count < 5) {\n    std::cout << count << '\\n';\n    count++;\n}\n\n// do-while runs the body at least once\ndo {\n    count--;\n} while (count > 0);",
      "",
    ],
    csharp: [
      "int count = 0;\nwhile (count < 5)\n{\n    Console.WriteLine(count);\n    count++;\n}\n\n// do-while runs the body at least once\ndo\n{\n    count--;\n} while (count > 0);",
      "",
    ],
    go: [
      "count := 0\nfor count < 5 {\n    fmt.Println(count)\n    count++\n}\n\n// infinite loop\nfor {\n    if count == 0 {\n        break\n    }\n    count--\n}",
      "Go has no while keyword; a for with only a condition acts as while.",
    ],
    rust: [
      "let mut count = 0;\nwhile count < 5 {\n    println!(\"{count}\");\n    count += 1;\n}\n\n// infinite loop\nloop {\n    count -= 1;\n    if count == 0 {\n        break;\n    }\n}",
      "loop can return a value: let x = loop { break 42; };",
    ],
    ruby: [
      "count = 0\nwhile count < 5\n  puts count\n  count += 1\nend\n\n# loop until a condition is true\nuntil count.zero?\n  count -= 1\nend",
      "",
    ],
    php: [
      "$count = 0;\nwhile ($count < 5) {\n    echo $count, PHP_EOL;\n    $count++;\n}\n\n// do-while runs the body at least once\ndo {\n    $count--;\n} while ($count > 0);",
      "",
    ],
    swift: [
      "var count = 0\nwhile count < 5 {\n    print(count)\n    count += 1\n}\n\n// repeat-while runs the body at least once\nrepeat {\n    count -= 1\n} while count > 0",
      "",
    ],
    kotlin: [
      "var count = 0\nwhile (count < 5) {\n    println(count)\n    count++\n}\n\n// do-while runs the body at least once\ndo {\n    count--\n} while (count > 0)",
      "",
    ],
    bash: [
      "count=0\nwhile [ \"$count\" -lt 5 ]; do\n    echo \"$count\"\n    count=$((count + 1))\ndone\n\n# read a file line by line\nwhile IFS= read -r line; do\n    echo \"$line\"\ndone < input.txt",
      "until [ condition ]; do ... done loops while the condition is false.",
    ],
  },
  "if else": {
    python: [
      "if x > 0:\n    print(\"positive\")\nelif x < 0:\n    print(\"negative\")\nelse:\n    print(\"zero\")\n\n# conditional expression\nlabel = \"even\" if x % 2 == 0 else \"odd\"",
      "Use and, or, not for boolean logic.",
    ],
    javascript: [
      "if (x > 0) {\n  console.log(\"positive\");\n} else if (x < 0) {\n  console.log(\"negative\");\n} else {\n  console.log(\"zero\");\n}\n\n// ternary\nconst label = x % 2 === 0 ? \"even\" : \"odd\";",
      "Prefer === and !== over == and != to avoid type coercion.",
    ],
    typescript: [
      "if (x > 0) {\n  console.log(\"positive\");\n} else if (x < 0) {\n  console.log(\"negative\");\n} else {\n  console.log(\"zero\");\n}\n\n// ternary\nconst label: string = x % 2 === 0 ? \"even\" : \"odd\";",
      "Prefer === and !== over == and != to avoid type coercion.",
    ],
    java: [
      "if (x > 0) {\n    System.out.println(\"positive\");\n} else if (x < 0) {\n    System.out.println(\"negative\");\n} else {\n    System.out.println(\"zero\");\n}\n\n// ternary\nString label = x % 2 == 0 ? \"even\" : \"odd\";",
      "Compare strings with a.equals(b), not ==.",
    ],
    c: [
      "if (x > 0) {\n    printf(\"positive\\n\");\n} else if (x < 0) {\n    printf(\"negative\\n\");\n} else {\n    printf(\"zero\\n\");\n}\n\n// ternary\nconst char *label = x % 2 == 0 ? \"even\" : \"odd\";",
      "Any non-zero value is true. Compare strings with strcmp(a, b) == 0.",
    ],
    cpp: [
      "if (x > 0) {\n    std::cout << \"positive\\n\";\n} else if (x < 0) {\n    std::cout << \"negative\\n\";\n} else {\n    std::cout << \"zero\\n\";\n}\n\n// ternary\nstd::string label = x % 2 == 0 ? \"even\" : \"odd\";",
      "",
    ],
    csharp: [
      "if (x > 0)\n{\n    Console.WriteLine(\"positive\");\n}\nelse if (x < 0)\n{\n    Console.WriteLine(\"negative\");\n}\nelse\n{\n    Console.WriteLine(\"zero\");\n}\n\n// ternary\nstring label = x % 2 == 0 ? \"even\" : \"odd\";",
      "",
    ],
    go: [
      "if x > 0 {\n    fmt.Println(\"positive\")\n} else if x < 0 {\n    fmt.Println(\"negative\")\n} else {\n    fmt.Println(\"zero\")\n}\n\n// with a short statement\nif n, err := strconv.Atoi(s); err == nil {\n    fmt.Println(\"parsed\", n)\n}",
      "Go has no ternary operator; no parentheses around the condition, braces are required.",
    ],
    rust: [
      "if x > 0 {\n    println!(\"positive\");\n} else if x < 0 {\n    println!(\"negative\");\n} else {\n    println!(\"zero\");\n}\n\n// if is an expression (no ternary operator)\nlet label = if x % 2 == 0 { \"even\" } else { \"odd\" };",
      "",
    ],
    ruby: [
      "if x > 0\n  puts \"positive\"\nelsif x < 0\n  puts \"negative\"\nelse\n  puts \"zero\"\nend\n\n# ternary and modifier forms\nlabel = x.even? ? \"even\" : \"odd\"\nputs \"big\" if x > 100",
      "Ruby spells it elsif. Only nil and false are falsy.",
    ],
    php: [
      "if ($x > 0) {\n    echo \"positive\";\n} elseif ($x < 0) {\n    echo \"negative\";\n} else {\n    echo \"zero\";\n}\n\n// ternary\n$label = $x % 2 === 0 ? \"even\" : \"odd\";",
      "Prefer === for strict comparison.",
    ],
    swift: [
      "if x > 0 {\n    print(\"positive\")\n} else if x < 0 {\n    print(\"negative\")\n} else {\n    print(\"zero\")\n}\n\n// ternary\nlet label = x % 2 == 0 ? \"even\" : \"odd\"",
      "",
    ],
    kotlin: [
      "if (x > 0) {\n    println(\"positive\")\n} else if (x < 0) {\n    println(\"negative\")\n} else {\n    println(\"zero\")\n}\n\n// if is an expression (no ternary operator)\nval label = if (x % 2 == 0) \"even\" else \"odd\"",
      "",
    ],
    bash: [
      "if [ \"$x\" -gt 0 ]; then\n    echo \"positive\"\nelif [ \"$x\" -lt 0 ]; then\n    echo \"negative\"\nelse\n    echo \"zero\"\nfi\n\n# string comparison\nif [[ \"$name\" == \"admin\" ]]; then\n    echo \"welcome\"\nfi",
      "Numbers: -eq -ne -lt -le -gt -ge. Strings: == and !=. Spaces inside [ ] are required.",
    ],
  },
  "switch": {
    python: [
      "match command:\n    case \"start\":\n        print(\"Starting\")\n    case \"stop\" | \"quit\":\n        print(\"Stopping\")\n    case _:\n        print(\"Unknown command\")",
      "match/case requires Python 3.10+. On older versions use if/elif/else or a dict lookup.",
    ],
    javascript: [
      "switch (day) {\n  case \"sat\":\n  case \"sun\":\n    console.log(\"Weekend\");\n    break;\n  case \"mon\":\n    console.log(\"Start of the week\");\n    break;\n  default:\n    console.log(\"Weekday\");\n}",
      "Without break, execution falls through to the next case. Cases compare with ===.",
    ],
    typescript: [
      "switch (day) {\n  case \"sat\":\n  case \"sun\":\n    console.log(\"Weekend\");\n    break;\n  case \"mon\":\n    console.log(\"Start of the week\");\n    break;\n  default:\n    console.log(\"Weekday\");\n}",
      "Without break, execution falls through to the next case. Cases compare with ===.",
    ],
    java: [
      "switch (day) {\n    case \"SAT\", \"SUN\" -> System.out.println(\"Weekend\");\n    case \"MON\" -> System.out.println(\"Start of the week\");\n    default -> System.out.println(\"Weekday\");\n}\n\n// switch expression\nString type = switch (day) {\n    case \"SAT\", \"SUN\" -> \"weekend\";\n    default -> \"weekday\";\n};",
      "Arrow cases and switch expressions need Java 14+; they never fall through. The classic form uses case X: with break.",
    ],
    c: [
      "switch (n) {\n    case 1:\n        printf(\"one\\n\");\n        break;\n    case 2:\n    case 3:\n        printf(\"two or three\\n\");\n        break;\n    default:\n        printf(\"other\\n\");\n        break;\n}",
      "switch works on integer types and chars, not strings. Without break, cases fall through.",
    ],
    cpp: [
      "switch (n) {\n    case 1:\n        std::cout << \"one\\n\";\n        break;\n    case 2:\n    case 3:\n        std::cout << \"two or three\\n\";\n        break;\n    default:\n        std::cout << \"other\\n\";\n        break;\n}",
      "switch works on integers, chars and enums, not std::string. Without break, cases fall through.",
    ],
    csharp: [
      "switch (day)\n{\n    case \"Sat\":\n    case \"Sun\":\n        Console.WriteLine(\"Weekend\");\n        break;\n    default:\n        Console.WriteLine(\"Weekday\");\n        break;\n}\n\n// switch expression\nstring type = day switch\n{\n    \"Sat\" or \"Sun\" => \"weekend\",\n    _ => \"weekday\",\n};",
      "Switch expressions need C# 8+, the or pattern C# 9+.",
    ],
    go: [
      "switch day {\ncase \"sat\", \"sun\":\n    fmt.Println(\"Weekend\")\ncase \"mon\":\n    fmt.Println(\"Start of the week\")\ndefault:\n    fmt.Println(\"Weekday\")\n}\n\n// switch with no value acts like if/else\nswitch {\ncase x < 0:\n    fmt.Println(\"negative\")\ndefault:\n    fmt.Println(\"non-negative\")\n}",
      "Cases do not fall through, so no break is needed (use fallthrough to opt in).",
    ],
    rust: [
      "match n {\n    1 => println!(\"one\"),\n    2 | 3 => println!(\"two or three\"),\n    4..=9 => println!(\"four to nine\"),\n    _ => println!(\"other\"),\n}\n\n// match is an expression\nlet size = match n {\n    0 => \"none\",\n    1..=9 => \"small\",\n    _ => \"large\",\n};",
      "match must be exhaustive; _ matches everything else.",
    ],
    ruby: [
      "case day\nwhen \"sat\", \"sun\"\n  puts \"Weekend\"\nwhen \"mon\"\n  puts \"Start of the week\"\nelse\n  puts \"Weekday\"\nend\n\n# ranges and classes work too\nsize = case n\n       when 0..9 then \"small\"\n       else \"large\"\n       end",
      "",
    ],
    php: [
      "switch ($day) {\n    case \"sat\":\n    case \"sun\":\n        echo \"Weekend\";\n        break;\n    default:\n        echo \"Weekday\";\n}\n\n// match expression (PHP 8+)\n$type = match ($day) {\n    \"sat\", \"sun\" => \"weekend\",\n    default => \"weekday\",\n};",
      "match uses strict comparison and never falls through; switch uses loose comparison.",
    ],
    swift: [
      "switch day {\ncase \"sat\", \"sun\":\n    print(\"Weekend\")\ncase \"mon\":\n    print(\"Start of the week\")\ndefault:\n    print(\"Weekday\")\n}\n\n// ranges\nswitch score {\ncase 90...100: print(\"A\")\ncase 80..<90: print(\"B\")\ndefault: print(\"C or below\")\n}",
      "switch must be exhaustive and cases do not fall through.",
    ],
    kotlin: [
      "when (day) {\n    \"sat\", \"sun\" -> println(\"Weekend\")\n    \"mon\" -> println(\"Start of the week\")\n    else -> println(\"Weekday\")\n}\n\n// when is an expression\nval size = when (n) {\n    0 -> \"none\"\n    in 1..9 -> \"small\"\n    else -> \"large\"\n}",
      "Kotlin uses when instead of switch.",
    ],
    bash: [
      "case \"$day\" in\n    sat|sun)\n        echo \"Weekend\"\n        ;;\n    mon)\n        echo \"Start of the week\"\n        ;;\n    *)\n        echo \"Weekday\"\n        ;;\nesac",
      "Patterns are globs; * is the default case.",
    ],
  },
  "function": {
    python: [
      "def add(a, b):\n    return a + b\n\n# default argument and type hints\ndef greet(name: str = \"world\") -> str:\n    return f\"Hello, {name}!\"\n\nprint(add(2, 3))\nprint(greet())",
      "",
    ],
    javascript: [
      "function add(a, b) {\n  return a + b;\n}\n\n// default parameter\nfunction greet(name = \"world\") {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(add(2, 3));\nconsole.log(greet());",
      "Arrow form: const add = (a, b) => a + b;",
    ],
    typescript: [
      "function add(a: number, b: number): number {\n  return a + b;\n}\n\n// default and optional parameters\nfunction greet(name = \"world\", excited?: boolean): string {\n  return `Hello, ${name}${excited ? \"!\" : \".\"}`;\n}\n\nconsole.log(add(2, 3));",
      "Arrow form: const add = (a: number, b: number): number => a + b;",
    ],
    java: [
      "static int add(int a, int b) {\n    return a + b;\n}\n\nstatic void greet(String name) {\n    System.out.println(\"Hello, \" + name);\n}\n\n// call it from main\nint sum = add(2, 3);",
      "Java functions are methods and must be declared inside a class.",
    ],
    c: [
      "int add(int a, int b);  // prototype, lets you call it before the definition\n\nint add(int a, int b) {\n    return a + b;\n}\n\nvoid greet(const char *name) {\n    printf(\"Hello, %s\\n\", name);\n}",
      "Call it from main: int sum = add(2, 3);",
    ],
    cpp: [
      "int add(int a, int b) {\n    return a + b;\n}\n\n// default argument, pass by const reference\nstd::string greet(const std::string& name = \"world\") {\n    return \"Hello, \" + name + \"!\";\n}\n\n// call: int sum = add(2, 3);",
      "",
    ],
    csharp: [
      "static int Add(int a, int b)\n{\n    return a + b;\n}\n\n// expression-bodied, with a default parameter\nstatic string Greet(string name = \"world\") => $\"Hello, {name}!\";\n\n// call: int sum = Add(2, 3);",
      "Methods live inside a class; with top-level statements you can also write local functions.",
    ],
    go: [
      "func add(a, b int) int {\n    return a + b\n}\n\n// multiple return values\nfunc divide(a, b float64) (float64, error) {\n    if b == 0 {\n        return 0, errors.New(\"division by zero\")\n    }\n    return a / b, nil\n}",
      "Capitalized names (Add) are exported from the package.",
    ],
    rust: [
      "fn add(a: i32, b: i32) -> i32 {\n    a + b // last expression without ; is returned\n}\n\nfn greet(name: &str) -> String {\n    format!(\"Hello, {name}!\")\n}\n\n// call: let sum = add(2, 3);",
      "",
    ],
    ruby: [
      "def add(a, b)\n  a + b # last expression is returned\nend\n\ndef greet(name = \"world\")\n  \"Hello, #{name}!\"\nend\n\nputs add(2, 3)\nputs greet",
      "Parentheses on calls are optional.",
    ],
    php: [
      "function add(int $a, int $b): int {\n    return $a + $b;\n}\n\nfunction greet(string $name = \"world\"): string {\n    return \"Hello, $name!\";\n}\n\necho add(2, 3);",
      "",
    ],
    swift: [
      "func add(_ a: Int, _ b: Int) -> Int {\n    return a + b\n}\n\nfunc greet(name: String = \"world\") -> String {\n    \"Hello, \\(name)!\"\n}\n\nprint(add(2, 3))\nprint(greet(name: \"Ana\"))",
      "Parameters have argument labels by default; _ removes the label at the call site.",
    ],
    kotlin: [
      "fun add(a: Int, b: Int): Int {\n    return a + b\n}\n\n// single-expression function with a default parameter\nfun greet(name: String = \"world\") = \"Hello, $name!\"\n\nprintln(add(2, 3))\nprintln(greet())",
      "",
    ],
    bash: [
      "greet() {\n    local name=\"$1\"\n    echo \"Hello, $name!\"\n}\n\ngreet \"Ana\"\n\n# capture the output as a \"return value\"\nmessage=$(greet \"Bob\")",
      "Arguments are $1, $2, ... ($@ is all of them). return only sets an exit status (0-255).",
    ],
  },
  "class": {
    python: [
      "class Dog:\n    def __init__(self, name, age):\n        self.name = name\n        self.age = age\n\n    def bark(self):\n        return f\"{self.name} says woof\"\n\n\ndog = Dog(\"Rex\", 3)\nprint(dog.bark())",
      "For simple data holders, see @dataclass from the dataclasses module.",
    ],
    javascript: [
      "class Dog {\n  constructor(name, age) {\n    this.name = name;\n    this.age = age;\n  }\n\n  bark() {\n    return `${this.name} says woof`;\n  }\n}\n\nconst dog = new Dog(\"Rex\", 3);\nconsole.log(dog.bark());",
      "Inherit with class Puppy extends Dog and call super(...) in the constructor.",
    ],
    typescript: [
      "class Dog {\n  constructor(public name: string, private age: number) {}\n\n  bark(): string {\n    return `${this.name} says woof`;\n  }\n}\n\nconst dog = new Dog(\"Rex\", 3);\nconsole.log(dog.bark());",
      "public/private on constructor parameters declare and assign the fields.",
    ],
    java: [
      "public class Dog {\n    private final String name;\n    private int age;\n\n    public Dog(String name, int age) {\n        this.name = name;\n        this.age = age;\n    }\n\n    public String bark() {\n        return name + \" says woof\";\n    }\n}\n\n// usage\nDog dog = new Dog(\"Rex\", 3);",
      "A public class must live in a file with the same name (Dog.java). For plain data use record Dog(String name, int age) {} (Java 16+).",
    ],
    cpp: [
      "class Dog {\npublic:\n    Dog(std::string name, int age) : name_(std::move(name)), age_(age) {}\n\n    std::string bark() const {\n        return name_ + \" says woof\";\n    }\n\nprivate:\n    std::string name_;\n    int age_;\n};\n\n// usage\nDog dog(\"Rex\", 3);",
      "Note the semicolon after the closing brace. struct is the same but members default to public.",
    ],
    csharp: [
      "public class Dog\n{\n    public string Name { get; }\n    public int Age { get; set; }\n\n    public Dog(string name, int age)\n    {\n        Name = name;\n        Age = age;\n    }\n\n    public string Bark() => $\"{Name} says woof\";\n}\n\n// usage\nvar dog = new Dog(\"Rex\", 3);",
      "For plain data use a record: public record Dog(string Name, int Age);",
    ],
    go: [
      "type Dog struct {\n    Name string\n    Age  int\n}\n\nfunc (d Dog) Bark() string {\n    return d.Name + \" says woof\"\n}\n\n// usage\ndog := Dog{Name: \"Rex\", Age: 3}\nfmt.Println(dog.Bark())",
      "Go has no classes; use a struct with methods. Use a pointer receiver (d *Dog) to modify fields.",
    ],
    rust: [
      "struct Dog {\n    name: String,\n    age: u32,\n}\n\nimpl Dog {\n    fn new(name: &str, age: u32) -> Self {\n        Dog { name: name.to_string(), age }\n    }\n\n    fn bark(&self) -> String {\n        format!(\"{} says woof\", self.name)\n    }\n}\n\n// usage\nlet dog = Dog::new(\"Rex\", 3);",
      "Rust has no classes; use a struct with an impl block. Shared behavior goes in traits.",
    ],
    ruby: [
      "class Dog\n  attr_reader :name, :age\n\n  def initialize(name, age)\n    @name = name\n    @age = age\n  end\n\n  def bark\n    \"#{@name} says woof\"\n  end\nend\n\ndog = Dog.new(\"Rex\", 3)\nputs dog.bark",
      "",
    ],
    php: [
      "class Dog {\n    public function __construct(\n        public string $name,\n        private int $age,\n    ) {}\n\n    public function bark(): string {\n        return \"{$this->name} says woof\";\n    }\n}\n\n$dog = new Dog(\"Rex\", 3);\necho $dog->bark();",
      "Constructor property promotion needs PHP 8.0+.",
    ],
    swift: [
      "class Dog {\n    let name: String\n    var age: Int\n\n    init(name: String, age: Int) {\n        self.name = name\n        self.age = age\n    }\n\n    func bark() -> String {\n        \"\\(name) says woof\"\n    }\n}\n\nlet dog = Dog(name: \"Rex\", age: 3)\nprint(dog.bark())",
      "Prefer struct for simple value types; it gets a memberwise initializer automatically.",
    ],
    kotlin: [
      "class Dog(val name: String, var age: Int) {\n    fun bark() = \"$name says woof\"\n}\n\nval dog = Dog(\"Rex\", 3)\nprintln(dog.bark())\n\n// data class adds equals, hashCode, toString and copy\ndata class Point(val x: Int, val y: Int)",
      "Classes are final by default; mark them open to allow inheritance.",
    ],
  },
  "list": {
    python: [
      "nums = [3, 1, 2]\nnums.append(4)\nfirst = nums[0]\nlast = nums[-1]\nsize = len(nums)\nmiddle = nums[1:3]  # slice",
      "",
    ],
    javascript: [
      "const nums = [3, 1, 2];\nnums.push(4);\nconst first = nums[0];\nconst last = nums.at(-1);\nconst size = nums.length;\nconst hasTwo = nums.includes(2);",
      "",
    ],
    typescript: [
      "const nums: number[] = [3, 1, 2];\nnums.push(4);\nconst first = nums[0];\nconst last = nums.at(-1);\nconst size = nums.length;\nconst hasTwo = nums.includes(2);",
      "",
    ],
    java: [
      "// fixed-size array\nint[] arr = {3, 1, 2};\nint len = arr.length;\n\n// resizable list\nList<Integer> nums = new ArrayList<>(List.of(3, 1, 2));\nnums.add(4);\nint first = nums.get(0);\nint size = nums.size();",
      "Needs import java.util.List; and import java.util.ArrayList;. List.of(...) alone is immutable.",
    ],
    c: [
      "int nums[5] = {3, 1, 2};  // capacity 5, rest are 0\nnums[3] = 4;\nint first = nums[0];\nsize_t size = sizeof nums / sizeof nums[0];  // 5",
      "C arrays are fixed-size; use malloc/realloc for a growable array. The sizeof trick does not work on a pointer.",
    ],
    cpp: [
      "std::vector<int> nums = {3, 1, 2};\nnums.push_back(4);\nint first = nums[0];\nint last = nums.back();\nstd::size_t size = nums.size();",
      "#include <vector>. Use nums.at(i) for bounds-checked access. std::array is the fixed-size version.",
    ],
    csharp: [
      "// fixed-size array\nint[] arr = { 3, 1, 2 };\nint len = arr.Length;\n\n// resizable list\nvar nums = new List<int> { 3, 1, 2 };\nnums.Add(4);\nint first = nums[0];\nint count = nums.Count;",
      "List<T> is in System.Collections.Generic.",
    ],
    go: [
      "nums := []int{3, 1, 2}\nnums = append(nums, 4)\nfirst := nums[0]\nlast := nums[len(nums)-1]\nsize := len(nums)",
      "A slice is Go's dynamic array; [3]int is a fixed-size array. Always reassign the result of append.",
    ],
    rust: [
      "let mut nums = vec![3, 1, 2];\nnums.push(4);\nlet first = nums[0];\nlet last = nums.last();  // Option<&i32>\nlet size = nums.len();",
      "Vec<T> is the growable list; [i32; 3] is a fixed-size array. nums.get(i) returns an Option instead of panicking.",
    ],
    ruby: [
      "nums = [3, 1, 2]\nnums << 4          # or nums.push(4)\nfirst = nums[0]\nlast = nums[-1]\nsize = nums.length",
      "",
    ],
    php: [
      "$nums = [3, 1, 2];\n$nums[] = 4;          // or array_push($nums, 4);\n$first = $nums[0];\n$last = $nums[array_key_last($nums)];\n$size = count($nums);",
      "",
    ],
    swift: [
      "var nums = [3, 1, 2]\nnums.append(4)\nlet first = nums[0]\nlet last = nums.last  // Optional\nlet size = nums.count",
      "Declare with let for an immutable array. Empty typed array: var names: [String] = []",
    ],
    kotlin: [
      "val nums = mutableListOf(3, 1, 2)\nnums.add(4)\nval first = nums[0]\nval last = nums.last()\nval size = nums.size\n\n// read-only list\nval fixed = listOf(1, 2, 3)",
      "arrayOf(1, 2, 3) creates a fixed-size Array.",
    ],
    bash: [
      "nums=(3 1 2)\nnums+=(4)\nfirst=${nums[0]}\nsize=${#nums[@]}\necho \"${nums[@]}\"",
      "",
    ],
  },
  "dictionary": {
    python: [
      "ages = {\"alice\": 30, \"bob\": 25}\nages[\"carol\"] = 35\nalice = ages[\"alice\"]\ndave = ages.get(\"dave\", 0)  # default if missing\n\nfor name, age in ages.items():\n    print(name, age)",
      "Check a key with: if \"bob\" in ages. Remove with del ages[\"bob\"].",
    ],
    javascript: [
      "const ages = new Map([[\"alice\", 30], [\"bob\", 25]]);\nages.set(\"carol\", 35);\nconst alice = ages.get(\"alice\");\nconst hasDave = ages.has(\"dave\");\n\nfor (const [name, age] of ages) {\n  console.log(name, age);\n}\n\n// a plain object also works for string keys\nconst scores = { alice: 90, bob: 80 };",
      "Iterate a plain object with Object.entries(scores).",
    ],
    typescript: [
      "const ages = new Map<string, number>([[\"alice\", 30], [\"bob\", 25]]);\nages.set(\"carol\", 35);\nconst alice = ages.get(\"alice\"); // number | undefined\n\nfor (const [name, age] of ages) {\n  console.log(name, age);\n}\n\n// a typed plain object\nconst scores: Record<string, number> = { alice: 90, bob: 80 };",
      "",
    ],
    java: [
      "Map<String, Integer> ages = new HashMap<>();\nages.put(\"alice\", 30);\nages.put(\"bob\", 25);\nint alice = ages.get(\"alice\");\nint dave = ages.getOrDefault(\"dave\", 0);\n\nfor (Map.Entry<String, Integer> e : ages.entrySet()) {\n    System.out.println(e.getKey() + \" \" + e.getValue());\n}",
      "Needs import java.util.Map; and import java.util.HashMap;. Use TreeMap for sorted keys.",
    ],
    cpp: [
      "std::map<std::string, int> ages = {{\"alice\", 30}, {\"bob\", 25}};\nages[\"carol\"] = 35;\nint alice = ages.at(\"alice\");  // throws if missing\nbool hasDave = ages.count(\"dave\") > 0;\n\nfor (const auto& [name, age] : ages) {\n    std::cout << name << \" \" << age << '\\n';\n}",
      "#include <map>. std::unordered_map is the hash-based version. operator[] inserts a default if the key is missing.",
    ],
    csharp: [
      "var ages = new Dictionary<string, int>\n{\n    [\"alice\"] = 30,\n    [\"bob\"] = 25,\n};\nages[\"carol\"] = 35;\n\nif (ages.TryGetValue(\"dave\", out int dave))\n{\n    Console.WriteLine(dave);\n}\n\nforeach (var (name, age) in ages)\n{\n    Console.WriteLine($\"{name} {age}\");\n}",
      "Dictionary is in System.Collections.Generic. ages[\"x\"] throws if the key is missing.",
    ],
    go: [
      "ages := map[string]int{\"alice\": 30, \"bob\": 25}\nages[\"carol\"] = 35\ndelete(ages, \"bob\")\n\nif age, ok := ages[\"dave\"]; ok {\n    fmt.Println(\"found\", age)\n}\n\nfor name, age := range ages {\n    fmt.Println(name, age)\n}",
      "A missing key returns the zero value; iteration order is random.",
    ],
    rust: [
      "use std::collections::HashMap;\n\nlet mut ages = HashMap::new();\nages.insert(\"alice\", 30);\nages.insert(\"bob\", 25);\nlet alice = ages.get(\"alice\");  // Option<&i32>\nlet dave = ages.get(\"dave\").copied().unwrap_or(0);\n\nfor (name, age) in &ages {\n    println!(\"{name} {age}\");\n}",
      "Use BTreeMap for sorted keys. Counting pattern: *map.entry(key).or_insert(0) += 1;",
    ],
    ruby: [
      "ages = { \"alice\" => 30, \"bob\" => 25 }\nages[\"carol\"] = 35\ndave = ages.fetch(\"dave\", 0)  # default if missing\n\nages.each do |name, age|\n  puts \"#{name} #{age}\"\nend\n\n# symbol keys\nperson = { name: \"Ana\", age: 30 }",
      "",
    ],
    php: [
      "$ages = [\"alice\" => 30, \"bob\" => 25];\n$ages[\"carol\"] = 35;\n$dave = $ages[\"dave\"] ?? 0;\n\nforeach ($ages as $name => $age) {\n    echo \"$name $age\\n\";\n}",
      "PHP arrays double as ordered maps. Check a key with array_key_exists or isset.",
    ],
    swift: [
      "var ages = [\"alice\": 30, \"bob\": 25]\nages[\"carol\"] = 35\nlet alice = ages[\"alice\"]  // Optional Int\nlet dave = ages[\"dave\", default: 0]\n\nfor (name, age) in ages {\n    print(name, age)\n}",
      "Remove a key by assigning nil: ages[\"bob\"] = nil",
    ],
    kotlin: [
      "val ages = mutableMapOf(\"alice\" to 30, \"bob\" to 25)\nages[\"carol\"] = 35\nval alice = ages[\"alice\"]  // Int?\nval dave = ages.getOrDefault(\"dave\", 0)\n\nfor ((name, age) in ages) {\n    println(\"$name $age\")\n}",
      "mapOf(...) creates a read-only map.",
    ],
    bash: [
      "declare -A ages\nages[alice]=30\nages[bob]=25\necho \"${ages[alice]}\"\n\nfor name in \"${!ages[@]}\"; do\n    echo \"$name ${ages[$name]}\"\ndone",
      "Associative arrays need Bash 4+ (macOS ships Bash 3; install a newer one). ${!ages[@]} lists the keys.",
    ],
  },
  "string formatting": {
    python: [
      "name = \"Ana\"\nage = 30\ngreeting = \"Hello, \" + name + \"!\"\nmsg = f\"{name} is {age} years old\"\nprice = f\"{3.14159:.2f}\"  # \"3.14\"\njoined = \", \".join([\"a\", \"b\", \"c\"])",
      "f-strings need Python 3.6+. Use str(n) to concatenate a number with +.",
    ],
    javascript: [
      "const name = \"Ana\";\nconst age = 30;\nconst greeting = \"Hello, \" + name + \"!\";\nconst msg = `${name} is ${age} years old`;\nconst price = (3.14159).toFixed(2); // \"3.14\"\nconst joined = [\"a\", \"b\", \"c\"].join(\", \");",
      "Template literals use backticks and allow multi-line strings.",
    ],
    typescript: [
      "const name = \"Ana\";\nconst age = 30;\nconst greeting = \"Hello, \" + name + \"!\";\nconst msg = `${name} is ${age} years old`;\nconst price = (3.14159).toFixed(2); // \"3.14\"\nconst joined = [\"a\", \"b\", \"c\"].join(\", \");",
      "Template literals use backticks and allow multi-line strings.",
    ],
    java: [
      "String name = \"Ana\";\nint age = 30;\nString greeting = \"Hello, \" + name + \"!\";\nString msg = String.format(\"%s is %d years old\", name, age);\nString price = String.format(\"%.2f\", 3.14159);\nString joined = String.join(\", \", \"a\", \"b\", \"c\");",
      "Use StringBuilder when concatenating inside a loop. Java 15+ also has \"%s\".formatted(name).",
    ],
    c: [
      "const char *name = \"Ana\";\nint age = 30;\nchar msg[64];\nsnprintf(msg, sizeof msg, \"%s is %d years old\", name, age);\n\n// append to a buffer\nchar greeting[32] = \"Hello, \";\nstrncat(greeting, name, sizeof greeting - strlen(greeting) - 1);",
      "#include <stdio.h> and <string.h>. C strings are char arrays; make sure the buffer is big enough.",
    ],
    cpp: [
      "std::string name = \"Ana\";\nint age = 30;\nstd::string greeting = \"Hello, \" + name + \"!\";\nstd::string msg = name + \" is \" + std::to_string(age) + \" years old\";\n\n// C++20\nstd::string formatted = std::format(\"{} is {} years old\", name, age);",
      "#include <string>, and <format> for std::format (C++20).",
    ],
    csharp: [
      "string name = \"Ana\";\nint age = 30;\nstring greeting = \"Hello, \" + name + \"!\";\nstring msg = $\"{name} is {age} years old\";\nstring price = $\"{3.14159:F2}\"; // \"3.14\"\nstring joined = string.Join(\", \", new[] { \"a\", \"b\", \"c\" });",
      "Use StringBuilder when concatenating inside a loop.",
    ],
    go: [
      "name := \"Ana\"\nage := 30\ngreeting := \"Hello, \" + name + \"!\"\nmsg := fmt.Sprintf(\"%s is %d years old\", name, age)\nprice := fmt.Sprintf(\"%.2f\", 3.14159)\njoined := strings.Join([]string{\"a\", \"b\", \"c\"}, \", \")",
      "Use strings.Builder for many appends. %v formats any value.",
    ],
    rust: [
      "let name = \"Ana\";\nlet age = 30;\nlet msg = format!(\"{name} is {age} years old\");\nlet price = format!(\"{:.2}\", 3.14159);\n\n// concatenation: String + &str\nlet greeting = String::from(\"Hello, \") + name + \"!\";\nlet joined = [\"a\", \"b\", \"c\"].join(\", \");",
      "Inline {name} needs Rust 1.58+. push_str appends to a mutable String.",
    ],
    ruby: [
      "name = \"Ana\"\nage = 30\ngreeting = \"Hello, \" + name + \"!\"\nmsg = \"#{name} is #{age} years old\"\nprice = format(\"%.2f\", 3.14159)\njoined = %w[a b c].join(\", \")",
      "Interpolation only works in double-quoted strings.",
    ],
    php: [
      "$name = \"Ana\";\n$age = 30;\n$greeting = \"Hello, \" . $name . \"!\";\n$msg = \"$name is $age years old\";\n$price = sprintf(\"%.2f\", 3.14159);\n$joined = implode(\", \", [\"a\", \"b\", \"c\"]);",
      "The dot operator concatenates. Variables interpolate only in double quotes; use {$obj->prop} for expressions.",
    ],
    swift: [
      "let name = \"Ana\"\nlet age = 30\nlet greeting = \"Hello, \" + name + \"!\"\nlet msg = \"\\(name) is \\(age) years old\"\nlet price = String(format: \"%.2f\", 3.14159) // needs import Foundation\nlet joined = [\"a\", \"b\", \"c\"].joined(separator: \", \")",
      "",
    ],
    kotlin: [
      "val name = \"Ana\"\nval age = 30\nval greeting = \"Hello, \" + name + \"!\"\nval msg = \"$name is $age years old, next year ${age + 1}\"\nval price = \"%.2f\".format(3.14159)\nval joined = listOf(\"a\", \"b\", \"c\").joinToString(\", \")",
      "",
    ],
    bash: [
      "name=\"Ana\"\nage=30\ngreeting=\"Hello, $name!\"\nmsg=\"${name} is ${age} years old\"\ngreeting+=\" Welcome.\"\nprintf -v price \"%.2f\" 3.14159",
      "Strings are concatenated just by placing them next to each other. Use double quotes so variables expand.",
    ],
  },
  "print": {
    python: [
      "print(\"Hello\")\nprint(\"a\", \"b\", sep=\", \")\nprint(\"no newline\", end=\"\")\nprint(f\"x = {x}\")",
      "",
    ],
    javascript: [
      "console.log(\"Hello\");\nconsole.log(\"x =\", x);\nconsole.error(\"something went wrong\");\n\n// Node.js: without a trailing newline\nprocess.stdout.write(\"no newline\");",
      "",
    ],
    typescript: [
      "console.log(\"Hello\");\nconsole.log(\"x =\", x);\nconsole.error(\"something went wrong\");",
      "",
    ],
    java: [
      "System.out.println(\"Hello\");\nSystem.out.print(\"no newline\");\nSystem.out.printf(\"x = %d%n\", x);\nSystem.err.println(\"error\");",
      "",
    ],
    c: [
      "printf(\"Hello\\n\");\nprintf(\"x = %d, y = %.2f\\n\", x, y);\nputs(\"puts adds a newline\");\nfprintf(stderr, \"error\\n\");",
      "#include <stdio.h>. Common specifiers: %d int, %f double, %s string, %c char, %zu size_t.",
    ],
    cpp: [
      "std::cout << \"Hello\" << '\\n';\nstd::cout << \"x = \" << x << std::endl;\nstd::cerr << \"error\\n\";",
      "#include <iostream>. std::endl also flushes; '\\n' is faster. C++23 adds std::println.",
    ],
    csharp: [
      "Console.WriteLine(\"Hello\");\nConsole.Write(\"no newline\");\nConsole.WriteLine($\"x = {x}\");",
      "",
    ],
    go: [
      "fmt.Println(\"Hello\")\nfmt.Println(\"x =\", x)\nfmt.Printf(\"x = %d\\n\", x)\nfmt.Print(\"no newline\")",
      "import \"fmt\". %v prints any value, %+v includes struct field names.",
    ],
    rust: [
      "println!(\"Hello\");\nprintln!(\"x = {x}\");\nprintln!(\"{:?}\", vec![1, 2, 3]); // debug format\nprint!(\"no newline\");\neprintln!(\"error\");",
      "",
    ],
    ruby: [
      "puts \"Hello\"\nprint \"no newline\"\nputs \"x = #{x}\"\np [1, 2, 3]  # inspect form, handy for debugging",
      "",
    ],
    php: [
      "echo \"Hello\\n\";\necho \"x = $x\", PHP_EOL;\nprintf(\"%.2f\\n\", 3.14159);\nprint_r([1, 2, 3]);  // arrays",
      "var_dump($x) shows type and value.",
    ],
    swift: [
      "print(\"Hello\")\nprint(\"x = \\(x)\")\nprint(\"a\", \"b\", separator: \", \")\nprint(\"no newline\", terminator: \"\")",
      "",
    ],
    kotlin: [
      "println(\"Hello\")\nprint(\"no newline\")\nprintln(\"x = $x\")",
      "",
    ],
    bash: [
      "echo \"Hello\"\necho \"x = $x\"\nprintf \"%s is %d\\n\" \"Ana\" 30\necho -n \"no newline\"\necho \"error\" >&2",
      "printf is more portable than echo for formatted output.",
    ],
  },
  "comment": {
    python: [
      "# single-line comment\n\nx = 5  # inline comment\n\n\"\"\"\nA triple-quoted string. As the first statement of a\nfunction or module it becomes the docstring.\n\"\"\"",
      "Python has no block comment syntax; use a # on each line.",
    ],
    javascript: [
      "// single-line comment\n\n/*\n  multi-line comment\n*/\n\n/** JSDoc comment for documentation */",
      "",
    ],
    typescript: [
      "// single-line comment\n\n/*\n  multi-line comment\n*/\n\n/** TSDoc comment for documentation */",
      "",
    ],
    java: [
      "// single-line comment\n\n/*\n * multi-line comment\n */\n\n/** Javadoc comment for documentation */",
      "",
    ],
    c: [
      "// single-line comment (C99+)\n\n/* multi-line\n   comment */",
      "Block comments do not nest.",
    ],
    cpp: [
      "// single-line comment\n\n/* multi-line\n   comment */",
      "Block comments do not nest; #if 0 ... #endif can disable a large chunk of code.",
    ],
    csharp: [
      "// single-line comment\n\n/* multi-line\n   comment */\n\n/// <summary>XML documentation comment</summary>",
      "",
    ],
    go: [
      "// single-line comment\n\n/* multi-line\n   comment */\n\n// Add returns the sum of a and b.\n// (a comment right above a declaration is its doc comment)",
      "Go style strongly prefers // comments, even for long blocks.",
    ],
    rust: [
      "// single-line comment\n\n/* multi-line\n   comment */\n\n/// Doc comment for the item below\nfn documented() {}",
      "//! writes a doc comment for the enclosing module or crate (at the top of the file).",
    ],
    ruby: [
      "# single-line comment\n\n=begin\nmulti-line comment\n(=begin and =end must start at column 0)\n=end",
      "Most Ruby code just uses # on each line.",
    ],
    php: [
      "// single-line comment\n# also a single-line comment\n\n/* multi-line\n   comment */\n\n/** PHPDoc comment */",
      "",
    ],
    swift: [
      "// single-line comment\n\n/* multi-line\n   /* block comments can nest */\n*/\n\n/// Documentation comment",
      "",
    ],
    kotlin: [
      "// single-line comment\n\n/* multi-line\n   /* block comments can nest */\n*/\n\n/** KDoc comment */",
      "",
    ],
    bash: [
      "# single-line comment\n\necho \"hi\"  # inline comment\n\n: '\nmulti-line \"comment\"\nusing a no-op command and a quoted string\n'",
      "Bash has no true block comment; # on each line is the safest choice.",
    ],
  },
  "read input": {
    python: [
      "name = input(\"Enter your name: \")\nage = int(input(\"Enter your age: \"))\nprint(f\"Hi {name}, you are {age}\")",
      "input() always returns a string; convert it with int() or float().",
    ],
    javascript: [
      "import readline from \"node:readline/promises\";\nimport { stdin as input, stdout as output } from \"node:process\";\n\nconst rl = readline.createInterface({ input, output });\nconst name = await rl.question(\"Enter your name: \");\nrl.close();\nconsole.log(`Hi ${name}`);",
      "Node.js ES module (top-level await). In a browser use prompt(\"Enter your name\").",
    ],
    typescript: [
      "import readline from \"node:readline/promises\";\nimport { stdin as input, stdout as output } from \"node:process\";\n\nconst rl = readline.createInterface({ input, output });\nconst name: string = await rl.question(\"Enter your name: \");\nrl.close();\nconsole.log(`Hi ${name}`);",
      "Node.js ES module; needs @types/node.",
    ],
    java: [
      "Scanner scanner = new Scanner(System.in);\nSystem.out.print(\"Enter your name: \");\nString name = scanner.nextLine();\nSystem.out.print(\"Enter your age: \");\nint age = scanner.nextInt();",
      "Needs import java.util.Scanner;. After nextInt(), call nextLine() once before reading another line.",
    ],
    c: [
      "char name[64];\nint age;\n\nprintf(\"Enter your name: \");\nif (fgets(name, sizeof name, stdin) != NULL) {\n    name[strcspn(name, \"\\n\")] = '\\0';  // strip the newline\n}\nprintf(\"Enter your age: \");\nif (scanf(\"%d\", &age) == 1) {\n    printf(\"Hi %s, you are %d\\n\", name, age);\n}",
      "#include <stdio.h> and <string.h>. Never use gets().",
    ],
    cpp: [
      "std::string name;\nint age;\n\nstd::cout << \"Enter your name: \";\nstd::getline(std::cin, name);\nstd::cout << \"Enter your age: \";\nstd::cin >> age;",
      "#include <iostream> and <string>. std::cin >> reads a single word; getline reads the whole line.",
    ],
    csharp: [
      "Console.Write(\"Enter your name: \");\nstring? name = Console.ReadLine();\n\nConsole.Write(\"Enter your age: \");\nif (int.TryParse(Console.ReadLine(), out int age))\n{\n    Console.WriteLine($\"Hi {name}, you are {age}\");\n}",
      "",
    ],
    go: [
      "scanner := bufio.NewScanner(os.Stdin)\n\nfmt.Print(\"Enter your name: \")\nscanner.Scan()\nname := scanner.Text()\n\nfmt.Print(\"Enter your age: \")\nscanner.Scan()\nage, err := strconv.Atoi(scanner.Text())",
      "Imports bufio, fmt, os, strconv. For a single word, fmt.Scanln(&name) also works.",
    ],
    rust: [
      "use std::io;\n\nlet mut name = String::new();\nprintln!(\"Enter your name:\");\nio::stdin().read_line(&mut name).expect(\"failed to read line\");\nlet name = name.trim();\n\nlet mut line = String::new();\nio::stdin().read_line(&mut line).expect(\"failed to read line\");\nlet age: u32 = line.trim().parse().expect(\"not a number\");",
      "read_line keeps the trailing newline, so trim() before parsing.",
    ],
    ruby: [
      "print \"Enter your name: \"\nname = gets.chomp\nprint \"Enter your age: \"\nage = gets.to_i\nputs \"Hi #{name}, you are #{age}\"",
      "chomp removes the trailing newline.",
    ],
    php: [
      "$name = readline(\"Enter your name: \");\n$age = (int) readline(\"Enter your age: \");\n\n// or read a raw line from STDIN\n$line = trim(fgets(STDIN));",
      "Command-line (CLI) scripts only; web pages read input from $_GET / $_POST.",
    ],
    swift: [
      "print(\"Enter your name: \", terminator: \"\")\nif let name = readLine() {\n    print(\"Hi \\(name)\")\n}\n\nlet age = Int(readLine() ?? \"\") ?? 0",
      "readLine() returns nil at end of input.",
    ],
    kotlin: [
      "print(\"Enter your name: \")\nval name = readln()\nprint(\"Enter your age: \")\nval age = readln().toInt()\nprintln(\"Hi $name, you are $age\")",
      "readln() needs Kotlin 1.6+ (older: readLine()!!). readlnOrNull() returns null at end of input.",
    ],
    bash: [
      "read -rp \"Enter your name: \" name\necho \"Hi $name\"\n\n# silent input, e.g. for passwords\nread -rsp \"Password: \" pass\necho",
      "",
    ],
  },
  "try catch": {
    python: [
      "try:\n    value = int(text)\nexcept ValueError as e:\n    print(f\"Invalid number: {e}\")\nelse:\n    print(\"Parsed\", value)  # runs only if no exception\nfinally:\n    print(\"done\")           # always runs\n\n# raise your own\nif not text:\n    raise ValueError(\"empty input\")",
      "",
    ],
    javascript: [
      "try {\n  const data = JSON.parse(text);\n  console.log(data);\n} catch (err) {\n  console.error(\"Invalid JSON:\", err.message);\n} finally {\n  console.log(\"done\");\n}\n\n// throw your own\nif (!text) throw new Error(\"empty input\");",
      "With async/await, wrap await calls in try/catch to handle rejected promises.",
    ],
    typescript: [
      "try {\n  const data = JSON.parse(text);\n  console.log(data);\n} catch (err) {\n  if (err instanceof Error) {\n    console.error(\"Invalid JSON:\", err.message);\n  }\n} finally {\n  console.log(\"done\");\n}\n\n// throw your own\nif (!text) throw new Error(\"empty input\");",
      "Caught values are typed unknown under strict mode, so narrow with instanceof.",
    ],
    java: [
      "try {\n    int n = Integer.parseInt(text);\n    System.out.println(n);\n} catch (NumberFormatException e) {\n    System.out.println(\"Invalid number: \" + e.getMessage());\n} finally {\n    System.out.println(\"done\");\n}\n\n// throw your own\nif (text.isEmpty()) {\n    throw new IllegalArgumentException(\"empty input\");\n}",
      "try-with-resources closes automatically: try (var reader = Files.newBufferedReader(path)) { ... }",
    ],
    cpp: [
      "try {\n    int n = std::stoi(text);\n    std::cout << n << '\\n';\n} catch (const std::invalid_argument& e) {\n    std::cerr << \"Invalid number: \" << e.what() << '\\n';\n} catch (const std::exception& e) {\n    std::cerr << \"Error: \" << e.what() << '\\n';\n}\n\n// throw your own\nif (text.empty()) throw std::runtime_error(\"empty input\");",
      "#include <stdexcept>. C++ has no finally; use RAII (destructors) for cleanup. Catch by const reference.",
    ],
    csharp: [
      "try\n{\n    int n = int.Parse(text);\n    Console.WriteLine(n);\n}\ncatch (FormatException ex)\n{\n    Console.WriteLine($\"Invalid number: {ex.Message}\");\n}\nfinally\n{\n    Console.WriteLine(\"done\");\n}\n\n// throw your own\nif (text.Length == 0) throw new ArgumentException(\"empty input\");",
      "",
    ],
    go: [
      "func parse(text string) (int, error) {\n    n, err := strconv.Atoi(text)\n    if err != nil {\n        return 0, fmt.Errorf(\"parse %q: %w\", text, err)\n    }\n    return n, nil\n}\n\n// caller\nn, err := parse(\"42\")\nif err != nil {\n    fmt.Println(\"error:\", err)\n    return\n}\nfmt.Println(n)",
      "Go has no try/catch: errors are returned as values and checked with if err != nil. panic/recover exist for truly exceptional cases.",
    ],
    rust: [
      "match \"42\".parse::<i32>() {\n    Ok(n) => println!(\"Parsed {n}\"),\n    Err(e) => println!(\"Invalid number: {e}\"),\n}\n\n// propagate errors with ? inside a function returning Result\nfn read_config(path: &str) -> Result<String, std::io::Error> {\n    let text = std::fs::read_to_string(path)?;\n    Ok(text)\n}",
      "Rust has no exceptions: fallible functions return Result<T, E>. panic! is for unrecoverable bugs.",
    ],
    ruby: [
      "begin\n  value = Integer(text)\nrescue ArgumentError => e\n  puts \"Invalid number: #{e.message}\"\nelse\n  puts \"Parsed #{value}\"\nensure\n  puts \"done\"\nend\n\n# raise your own\nraise ArgumentError, \"empty input\" if text.empty?",
      "",
    ],
    php: [
      "try {\n    $data = json_decode($text, flags: JSON_THROW_ON_ERROR);\n} catch (JsonException $e) {\n    echo \"Invalid JSON: \", $e->getMessage();\n} finally {\n    echo \"done\";\n}\n\n// throw your own\nif ($text === \"\") {\n    throw new InvalidArgumentException(\"empty input\");\n}",
      "Named arguments need PHP 8+.",
    ],
    swift: [
      "enum ParseError: Error {\n    case invalid(String)\n}\n\nfunc parse(_ text: String) throws -> Int {\n    guard let n = Int(text) else { throw ParseError.invalid(text) }\n    return n\n}\n\ndo {\n    let n = try parse(\"42\")\n    print(n)\n} catch {\n    print(\"Error: \\(error)\")\n}",
      "try? turns an error into nil: let n = try? parse(\"x\")",
    ],
    kotlin: [
      "try {\n    val n = text.toInt()\n    println(n)\n} catch (e: NumberFormatException) {\n    println(\"Invalid number: ${e.message}\")\n} finally {\n    println(\"done\")\n}\n\n// try is an expression\nval safe = try { text.toInt() } catch (e: NumberFormatException) { 0 }\n\n// throw your own\nif (text.isEmpty()) throw IllegalArgumentException(\"empty input\")",
      "",
    ],
  },
  "import": {
    python: [
      "import math\nfrom os import path\nfrom collections import Counter, defaultdict\nimport numpy as np  # third-party: pip install numpy\n\nprint(math.sqrt(16))",
      "Import your own file mymodule.py with: import mymodule",
    ],
    javascript: [
      "// ES modules\nimport fs from \"node:fs\";\nimport { readFile } from \"node:fs/promises\";\nimport * as utils from \"./utils.js\";\n\n// in utils.js: export function add(a, b) { return a + b; }",
      "Older CommonJS style: const path = require(\"node:path\"); (module.exports to export).",
    ],
    typescript: [
      "import { readFile } from \"node:fs/promises\";\nimport * as utils from \"./utils\";\nimport type { User } from \"./types\";\n\n// in utils.ts: export function add(a: number, b: number) { return a + b; }",
      "import type imports only types and is erased at compile time.",
    ],
    java: [
      "import java.util.List;\nimport java.util.ArrayList;\nimport java.util.*;                // whole package\nimport static java.lang.Math.sqrt; // static member",
      "java.lang (String, Math, System) is imported automatically.",
    ],
    c: [
      "#include <stdio.h>     // standard library header\n#include <stdlib.h>\n#include <string.h>\n#include \"myheader.h\"  // your own header",
      "Angle brackets search system paths; quotes search the current directory first.",
    ],
    cpp: [
      "#include <iostream>\n#include <string>\n#include <vector>\n#include \"myheader.h\"\n\nusing std::cout;  // bring one name into scope",
      "Avoid using namespace std; in headers.",
    ],
    csharp: [
      "using System;\nusing System.Collections.Generic;\nusing System.Linq;\nusing static System.Math;  // call Sqrt() directly",
      ".NET 6+ projects add common usings implicitly (global usings).",
    ],
    go: [
      "import (\n    \"fmt\"\n    \"os\"\n    \"strings\"\n\n    \"github.com/google/uuid\" // third-party: go get github.com/google/uuid\n)",
      "Unused imports are a compile error.",
    ],
    rust: [
      "use std::collections::HashMap;\nuse std::fs;\nuse std::io::{self, Write};\n\n// external crate: run cargo add rand, then\nuse rand::Rng;",
      "Declare your own file src/utils.rs as a module with mod utils; then use utils::add;",
    ],
    ruby: [
      "require \"json\"\nrequire \"set\"\nrequire_relative \"helpers\"  # your own helpers.rb",
      "",
    ],
    php: [
      "use App\\Models\\User;  // namespaced class\n\nrequire_once __DIR__ . \"/vendor/autoload.php\";  // Composer\nrequire_once __DIR__ . \"/helpers.php\";\ninclude \"config.php\";  // only a warning if missing",
      "require stops with a fatal error if the file is missing; include only warns.",
    ],
    swift: [
      "import Foundation\nimport SwiftUI",
      "Files in the same module see each other without imports.",
    ],
    kotlin: [
      "import java.io.File\nimport kotlin.math.sqrt\nimport kotlin.math.*   // everything in a package",
      "Rename on import with: import java.io.File as JFile",
    ],
    bash: [
      "source ./lib.sh\n. ./config.sh   # . is the POSIX spelling of source",
      "Runs the other script in the current shell, so its functions and variables become available.",
    ],
  },
  "read file": {
    python: [
      "with open(\"data.txt\", encoding=\"utf-8\") as f:\n    content = f.read()\n\n# line by line\nwith open(\"data.txt\", encoding=\"utf-8\") as f:\n    for line in f:\n        print(line.rstrip(\"\\n\"))",
      "with closes the file automatically. pathlib alternative: Path(\"data.txt\").read_text()",
    ],
    javascript: [
      "import { readFile } from \"node:fs/promises\";\nimport { readFileSync } from \"node:fs\";\n\nconst content = await readFile(\"data.txt\", \"utf8\");\nconst lines = content.split(\"\\n\");\n\n// synchronous\nconst text = readFileSync(\"data.txt\", \"utf8\");",
      "Node.js. In the browser, read user-selected files with the File API (file.text()).",
    ],
    typescript: [
      "import { readFile } from \"node:fs/promises\";\n\nconst content: string = await readFile(\"data.txt\", \"utf8\");\nfor (const line of content.split(\"\\n\")) {\n  console.log(line);\n}",
      "Node.js; needs @types/node.",
    ],
    java: [
      "Path path = Path.of(\"data.txt\");\nString content = Files.readString(path);\n\n// line by line\nList<String> lines = Files.readAllLines(path);\nfor (String line : lines) {\n    System.out.println(line);\n}",
      "Imports java.nio.file.Files and java.nio.file.Path; the method must handle or declare IOException. Java 11+.",
    ],
    c: [
      "FILE *fp = fopen(\"data.txt\", \"r\");\nif (fp == NULL) {\n    perror(\"fopen\");\n    return 1;\n}\n\nchar line[256];\nwhile (fgets(line, sizeof line, fp) != NULL) {\n    printf(\"%s\", line);\n}\nfclose(fp);",
      "#include <stdio.h>. fgets keeps the newline at the end of each line.",
    ],
    cpp: [
      "std::ifstream file(\"data.txt\");\nif (!file) {\n    std::cerr << \"Cannot open file\\n\";\n    return 1;\n}\n\nstd::string line;\nwhile (std::getline(file, line)) {\n    std::cout << line << '\\n';\n}",
      "#include <fstream>. The file closes automatically when it goes out of scope.",
    ],
    csharp: [
      "string content = File.ReadAllText(\"data.txt\");\n\n// line by line (streams lazily)\nforeach (string line in File.ReadLines(\"data.txt\"))\n{\n    Console.WriteLine(line);\n}",
      "File is in System.IO.",
    ],
    go: [
      "data, err := os.ReadFile(\"data.txt\")\nif err != nil {\n    log.Fatal(err)\n}\nfmt.Println(string(data))\n\n// line by line\nf, err := os.Open(\"data.txt\")\nif err != nil {\n    log.Fatal(err)\n}\ndefer f.Close()\n\nscanner := bufio.NewScanner(f)\nfor scanner.Scan() {\n    fmt.Println(scanner.Text())\n}",
      "",
    ],
    rust: [
      "use std::fs;\n\nlet content = fs::read_to_string(\"data.txt\").expect(\"could not read file\");\n\n// line by line\nfor line in content.lines() {\n    println!(\"{line}\");\n}",
      "For large files use std::io::BufReader::new(file).lines().",
    ],
    ruby: [
      "content = File.read(\"data.txt\")\n\n# line by line\nFile.foreach(\"data.txt\") do |line|\n  puts line\nend\n\nlines = File.readlines(\"data.txt\", chomp: true)",
      "",
    ],
    php: [
      "$content = file_get_contents(\"data.txt\");\n\n// line by line\n$lines = file(\"data.txt\", FILE_IGNORE_NEW_LINES);\nforeach ($lines as $line) {\n    echo $line, PHP_EOL;\n}",
      "file_get_contents returns false on failure.",
    ],
    swift: [
      "import Foundation\n\ndo {\n    let content = try String(contentsOfFile: \"data.txt\", encoding: .utf8)\n    for line in content.split(separator: \"\\n\") {\n        print(line)\n    }\n} catch {\n    print(\"Error: \\(error)\")\n}",
      "",
    ],
    kotlin: [
      "import java.io.File\n\nval content = File(\"data.txt\").readText()\n\n// line by line\nFile(\"data.txt\").forEachLine { line ->\n    println(line)\n}\n\nval lines = File(\"data.txt\").readLines()",
      "",
    ],
    bash: [
      "content=$(<data.txt)\n\n# line by line\nwhile IFS= read -r line; do\n    echo \"$line\"\ndone < data.txt",
      "IFS= and -r keep whitespace and backslashes intact.",
    ],
  },
  "write file": {
    python: [
      "with open(\"out.txt\", \"w\", encoding=\"utf-8\") as f:\n    f.write(\"Hello\\n\")\n\n# append\nwith open(\"out.txt\", \"a\", encoding=\"utf-8\") as f:\n    f.write(\"more\\n\")",
      "\"w\" overwrites, \"a\" appends, \"x\" fails if the file exists.",
    ],
    javascript: [
      "import { writeFile, appendFile } from \"node:fs/promises\";\n\nawait writeFile(\"out.txt\", \"Hello\\n\", \"utf8\");\nawait appendFile(\"out.txt\", \"more\\n\");",
      "Node.js. Synchronous versions: writeFileSync / appendFileSync from node:fs.",
    ],
    typescript: [
      "import { writeFile, appendFile } from \"node:fs/promises\";\n\nawait writeFile(\"out.txt\", \"Hello\\n\", \"utf8\");\nawait appendFile(\"out.txt\", \"more\\n\");",
      "Node.js; needs @types/node.",
    ],
    java: [
      "Path path = Path.of(\"out.txt\");\nFiles.writeString(path, \"Hello\\n\");\n\n// append\nFiles.writeString(path, \"more\\n\", StandardOpenOption.APPEND);",
      "Imports java.nio.file.*; the method must handle or declare IOException. Java 11+.",
    ],
    c: [
      "FILE *fp = fopen(\"out.txt\", \"w\");  // \"a\" to append\nif (fp == NULL) {\n    perror(\"fopen\");\n    return 1;\n}\nfprintf(fp, \"Hello %d\\n\", 42);\nfputs(\"another line\\n\", fp);\nfclose(fp);",
      "#include <stdio.h>.",
    ],
    cpp: [
      "std::ofstream out(\"out.txt\");  // std::ofstream out(\"out.txt\", std::ios::app); to append\nif (!out) {\n    std::cerr << \"Cannot open file\\n\";\n    return 1;\n}\nout << \"Hello\\n\" << 42 << '\\n';",
      "#include <fstream>. The file is flushed and closed when out goes out of scope.",
    ],
    csharp: [
      "File.WriteAllText(\"out.txt\", \"Hello\\n\");\nFile.AppendAllText(\"out.txt\", \"more\\n\");\n\n// many lines\nusing var writer = new StreamWriter(\"log.txt\");\nwriter.WriteLine(\"line 1\");",
      "File and StreamWriter are in System.IO.",
    ],
    go: [
      "err := os.WriteFile(\"out.txt\", []byte(\"Hello\\n\"), 0644)\nif err != nil {\n    log.Fatal(err)\n}\n\n// append\nf, err := os.OpenFile(\"out.txt\", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)\nif err != nil {\n    log.Fatal(err)\n}\ndefer f.Close()\nfmt.Fprintln(f, \"more\")",
      "",
    ],
    rust: [
      "use std::fs;\nuse std::io::Write;\n\nfs::write(\"out.txt\", \"Hello\\n\").expect(\"write failed\");\n\n// append\nlet mut f = fs::OpenOptions::new()\n    .append(true)\n    .create(true)\n    .open(\"out.txt\")\n    .expect(\"open failed\");\nwriteln!(f, \"more\").expect(\"write failed\");",
      "",
    ],
    ruby: [
      "File.write(\"out.txt\", \"Hello\\n\")\n\n# append\nFile.open(\"out.txt\", \"a\") do |f|\n  f.puts \"more\"\nend",
      "",
    ],
    php: [
      "file_put_contents(\"out.txt\", \"Hello\\n\");\n\n// append\nfile_put_contents(\"out.txt\", \"more\\n\", FILE_APPEND);",
      "",
    ],
    swift: [
      "import Foundation\n\nlet text = \"Hello\\n\"\ndo {\n    try text.write(toFile: \"out.txt\", atomically: true, encoding: .utf8)\n} catch {\n    print(\"Error: \\(error)\")\n}",
      "",
    ],
    kotlin: [
      "import java.io.File\n\nFile(\"out.txt\").writeText(\"Hello\\n\")\nFile(\"out.txt\").appendText(\"more\\n\")",
      "",
    ],
    bash: [
      "echo \"Hello\" > out.txt   # overwrite\necho \"more\" >> out.txt   # append\n\ncat > notes.txt <<EOF\nline 1\nline 2\nEOF",
      "",
    ],
  },
  "sort": {
    python: [
      "nums = [3, 1, 2]\nnums.sort()                             # in place\ndesc = sorted(nums, reverse=True)       # new list\n\nwords = [\"pear\", \"fig\", \"apple\"]\nwords.sort(key=len)                     # by length",
      "",
    ],
    javascript: [
      "const nums = [3, 10, 1, 2];\nnums.sort((a, b) => a - b);          // numeric ascending\n\nconst words = [\"pear\", \"fig\", \"apple\"];\nwords.sort();                        // alphabetical\nwords.sort((a, b) => a.length - b.length);\n\nconst desc = nums.toSorted((a, b) => b - a); // sorted copy (ES2023)",
      "Without a comparator sort() compares as strings, so [10, 9].sort() stays [10, 9].",
    ],
    typescript: [
      "const nums: number[] = [3, 10, 1, 2];\nnums.sort((a, b) => a - b);          // numeric ascending\n\nconst words: string[] = [\"pear\", \"fig\", \"apple\"];\nwords.sort((a, b) => a.localeCompare(b));\n\nconst desc = [...nums].sort((a, b) => b - a); // sorted copy",
      "Without a comparator sort() compares as strings.",
    ],
    java: [
      "int[] arr = {3, 1, 2};\nArrays.sort(arr);\n\nList<String> words = new ArrayList<>(List.of(\"pear\", \"fig\", \"apple\"));\nCollections.sort(words);\nwords.sort(Comparator.comparing(String::length));  // by length\nwords.sort(Comparator.reverseOrder());             // descending",
      "Imports java.util.*.",
    ],
    c: [
      "int compare_ints(const void *a, const void *b) {\n    int x = *(const int *)a;\n    int y = *(const int *)b;\n    return (x > y) - (x < y);\n}\n\n// inside a function\nint nums[] = {3, 1, 2};\nsize_t n = sizeof nums / sizeof nums[0];\nqsort(nums, n, sizeof nums[0], compare_ints);",
      "#include <stdlib.h>. Return a negative, zero or positive value from the comparator.",
    ],
    cpp: [
      "std::vector<int> nums = {3, 1, 2};\nstd::sort(nums.begin(), nums.end());\nstd::sort(nums.begin(), nums.end(), std::greater<int>());  // descending\n\nstd::vector<std::string> words = {\"pear\", \"fig\", \"apple\"};\nstd::sort(words.begin(), words.end(),\n          [](const std::string& a, const std::string& b) { return a.size() < b.size(); });",
      "#include <algorithm> (and <functional> for std::greater). C++20: std::ranges::sort(nums);",
    ],
    csharp: [
      "var nums = new List<int> { 3, 1, 2 };\nnums.Sort();\n\nint[] arr = { 3, 1, 2 };\nArray.Sort(arr);\n\n// LINQ returns a new sorted sequence\nvar words = new List<string> { \"pear\", \"fig\", \"apple\" };\nvar byLength = words.OrderBy(w => w.Length).ToList();\nvar desc = nums.OrderByDescending(n => n).ToList();",
      "OrderBy needs using System.Linq;.",
    ],
    go: [
      "nums := []int{3, 1, 2}\nslices.Sort(nums)\n\nwords := []string{\"pear\", \"fig\", \"apple\"}\nsort.Slice(words, func(i, j int) bool {\n    return len(words[i]) < len(words[j])\n})",
      "slices needs Go 1.21+ (import \"slices\"); sort.Slice is in \"sort\".",
    ],
    rust: [
      "let mut nums = vec![3, 1, 2];\nnums.sort();\nnums.sort_by(|a, b| b.cmp(a));  // descending\n\nlet mut words = vec![\"pear\", \"fig\", \"apple\"];\nwords.sort_by_key(|w| w.len());",
      "Floats do not implement Ord; sort them with v.sort_by(|a, b| a.total_cmp(b)).",
    ],
    ruby: [
      "nums = [3, 1, 2]\nsorted = nums.sort\nnums.sort!               # in place\ndesc = nums.sort.reverse\n\nwords = %w[pear fig apple]\nby_length = words.sort_by(&:length)",
      "",
    ],
    php: [
      "$nums = [3, 1, 2];\nsort($nums);   // ascending, in place\nrsort($nums);  // descending\n\n$words = [\"pear\", \"fig\", \"apple\"];\nusort($words, fn($a, $b) => strlen($a) <=> strlen($b));",
      "asort/arsort sort associative arrays by value, ksort/krsort by key.",
    ],
    swift: [
      "var nums = [3, 1, 2]\nnums.sort()                    // in place\nlet desc = nums.sorted(by: >)  // new array\n\nlet words = [\"pear\", \"fig\", \"apple\"]\nlet byLength = words.sorted { $0.count < $1.count }",
      "",
    ],
    kotlin: [
      "val nums = mutableListOf(3, 1, 2)\nnums.sort()                         // in place\nval desc = nums.sortedDescending()  // new list\n\nval words = listOf(\"pear\", \"fig\", \"apple\")\nval byLength = words.sortedBy { it.length }",
      "",
    ],
    bash: [
      "nums=(3 10 1 2)\nmapfile -t sorted < <(printf \"%s\\n\" \"${nums[@]}\" | sort -n)\necho \"${sorted[@]}\"\n\n# sort the lines of a file\nsort names.txt\nsort -rn scores.txt   # numeric, descending",
      "sort -n compares numerically; without it 10 sorts before 2.",
    ],
  },
  "string length": {
    python: [
      "s = \"hello\"\nlength = len(s)  # 5",
      "len counts characters (code points); len(s.encode()) gives the size in bytes.",
    ],
    javascript: [
      "const s = \"hello\";\nconst length = s.length; // 5\n\n// count code points, not UTF-16 units\nconst chars = [...s].length;",
      ".length counts UTF-16 code units, so some symbols count as 2.",
    ],
    typescript: [
      "const s: string = \"hello\";\nconst length: number = s.length; // 5",
      ".length counts UTF-16 code units; [...s].length counts code points.",
    ],
    java: [
      "String s = \"hello\";\nint length = s.length(); // 5",
      "Strings use length(); arrays use the .length field (no parentheses).",
    ],
    c: [
      "const char *s = \"hello\";\nsize_t length = strlen(s); // 5, excludes the '\\0'",
      "#include <string.h>. strlen counts bytes up to the terminating null.",
    ],
    cpp: [
      "std::string s = \"hello\";\nstd::size_t length = s.size(); // 5, same as s.length()",
      "",
    ],
    csharp: [
      "string s = \"hello\";\nint length = s.Length; // 5",
      "",
    ],
    go: [
      "s := \"hello\"\nlength := len(s)                   // bytes\nchars := utf8.RuneCountInString(s) // characters",
      "len counts bytes; import \"unicode/utf8\" to count characters.",
    ],
    rust: [
      "let s = \"hello\";\nlet bytes = s.len();            // bytes\nlet chars = s.chars().count();  // characters",
      "",
    ],
    ruby: [
      "s = \"hello\"\nlength = s.length  # 5, same as s.size",
      "",
    ],
    php: [
      "$s = \"hello\";\n$length = strlen($s);    // bytes\n$chars = mb_strlen($s);  // characters (multibyte-safe)",
      "",
    ],
    swift: [
      "let s = \"hello\"\nlet length = s.count // 5",
      "count counts user-visible characters; s.utf8.count gives bytes.",
    ],
    kotlin: [
      "val s = \"hello\"\nval length = s.length // 5",
      "",
    ],
    bash: [
      "s=\"hello\"\necho \"${#s}\"  # 5",
      "",
    ],
  },
  "string to int": {
    python: [
      "n = int(\"42\")\nf = float(\"3.14\")\n\ntry:\n    n = int(user_text)\nexcept ValueError:\n    print(\"not a number\")",
      "int(\"ff\", 16) parses other bases.",
    ],
    javascript: [
      "const n = parseInt(\"42\", 10);\nconst f = parseFloat(\"3.14\");\nconst m = Number(\"42\");  // stricter: Number(\"42px\") is NaN\n\nif (Number.isNaN(n)) {\n  console.log(\"not a number\");\n}",
      "parseInt(\"42px\", 10) returns 42; Number(\"42px\") returns NaN.",
    ],
    typescript: [
      "const n: number = parseInt(\"42\", 10);\nconst f: number = parseFloat(\"3.14\");\nconst m: number = Number(\"42\");  // stricter: Number(\"42px\") is NaN\n\nif (Number.isNaN(n)) {\n  console.log(\"not a number\");\n}",
      "",
    ],
    java: [
      "int n = Integer.parseInt(\"42\");\nlong big = Long.parseLong(\"9000000000\");\ndouble d = Double.parseDouble(\"3.14\");\n\ntry {\n    int bad = Integer.parseInt(\"abc\");\n} catch (NumberFormatException e) {\n    System.out.println(\"not a number\");\n}",
      "",
    ],
    c: [
      "const char *text = \"42\";\nchar *end;\nerrno = 0;\nlong n = strtol(text, &end, 10);\nif (errno != 0 || end == text || *end != '\\0') {\n    printf(\"not a number\\n\");\n}\n\nint quick = atoi(\"42\");  // no error checking",
      "#include <stdlib.h> and <errno.h>. Prefer strtol over atoi because it reports errors.",
    ],
    cpp: [
      "int n = std::stoi(\"42\");\nlong long big = std::stoll(\"9000000000\");\ndouble d = std::stod(\"3.14\");\n\ntry {\n    int bad = std::stoi(\"abc\");\n} catch (const std::invalid_argument&) {\n    std::cout << \"not a number\\n\";\n}",
      "#include <string>. C++17 std::from_chars in <charconv> parses without exceptions.",
    ],
    csharp: [
      "int n = int.Parse(\"42\");  // throws FormatException on bad input\n\nif (int.TryParse(input, out int value))\n{\n    Console.WriteLine(value);\n}\nelse\n{\n    Console.WriteLine(\"not a number\");\n}",
      "",
    ],
    go: [
      "n, err := strconv.Atoi(\"42\")\nif err != nil {\n    fmt.Println(\"not a number\")\n}\n\nbig, err := strconv.ParseInt(\"9000000000\", 10, 64)\nf, err := strconv.ParseFloat(\"3.14\", 64)",
      "import \"strconv\".",
    ],
    rust: [
      "let n: i32 = \"42\".parse().expect(\"not a number\");\n\nmatch \"abc\".parse::<i32>() {\n    Ok(n) => println!(\"{n}\"),\n    Err(e) => println!(\"error: {e}\"),\n}",
      "Trim input from read_line first: line.trim().parse::<i32>()",
    ],
    ruby: [
      "n = \"42\".to_i            # \"abc\".to_i returns 0\nf = \"3.14\".to_f\nstrict = Integer(\"42\")   # raises ArgumentError on bad input",
      "",
    ],
    php: [
      "$n = (int) \"42\";\n$m = intval(\"42\");\n$f = (float) \"3.14\";\n\n$valid = filter_var(\"42\", FILTER_VALIDATE_INT);  // false if invalid",
      "",
    ],
    swift: [
      "if let n = Int(\"42\") {\n    print(n)\n} else {\n    print(\"not a number\")\n}\n\nlet d = Double(\"3.14\") ?? 0",
      "Int(string) returns nil instead of throwing.",
    ],
    kotlin: [
      "val n = \"42\".toInt()                // throws NumberFormatException\nval safe = \"abc\".toIntOrNull() ?: 0\nval d = \"3.14\".toDouble()",
      "",
    ],
    bash: [
      "s=\"42\"\nn=$((s + 1))   # arithmetic treats it as a number\necho \"$n\"\n\nif [[ \"$s\" =~ ^-?[0-9]+$ ]]; then\n    echo \"valid integer\"\nfi",
      "Bash variables are strings; arithmetic contexts $(( )) parse them as integers.",
    ],
  },
  "random number": {
    python: [
      "import random\n\nn = random.randint(1, 10)            # 1 to 10 inclusive\nf = random.random()                  # 0.0 to < 1.0\nitem = random.choice([\"a\", \"b\", \"c\"])\nrandom.shuffle(items)                # in place",
      "Use the secrets module for passwords and tokens.",
    ],
    javascript: [
      "// integer from min to max inclusive\nfunction randomInt(min, max) {\n  return Math.floor(Math.random() * (max - min + 1)) + min;\n}\n\nconst n = randomInt(1, 10);\nconst f = Math.random(); // 0 to < 1",
      "For security-sensitive values use crypto.getRandomValues() or crypto.randomUUID().",
    ],
    typescript: [
      "// integer from min to max inclusive\nfunction randomInt(min: number, max: number): number {\n  return Math.floor(Math.random() * (max - min + 1)) + min;\n}\n\nconst n = randomInt(1, 10);\nconst f = Math.random(); // 0 to < 1",
      "For security-sensitive values use crypto.getRandomValues().",
    ],
    java: [
      "Random rand = new Random();\nint n = rand.nextInt(10) + 1;  // 1 to 10\ndouble d = rand.nextDouble();  // 0.0 to < 1.0\n\n// bounds form: origin inclusive, bound exclusive\nint m = ThreadLocalRandom.current().nextInt(1, 11);",
      "Imports java.util.Random and java.util.concurrent.ThreadLocalRandom. Use SecureRandom for security.",
    ],
    c: [
      "#include <stdlib.h>\n#include <time.h>\n\nsrand((unsigned) time(NULL));  // seed once at program start\nint n = rand() % 10 + 1;       // 1 to 10",
      "rand() is fine for simple programs, not for security.",
    ],
    cpp: [
      "std::random_device rd;\nstd::mt19937 gen(rd());\nstd::uniform_int_distribution<int> dist(1, 10);\nint n = dist(gen);  // 1 to 10 inclusive\n\nstd::uniform_real_distribution<double> real(0.0, 1.0);\ndouble f = real(gen);",
      "#include <random>. Create the generator once and reuse it.",
    ],
    csharp: [
      "int n = Random.Shared.Next(1, 11);      // 1 to 10 (upper bound exclusive)\ndouble d = Random.Shared.NextDouble();  // 0.0 to < 1.0",
      "Random.Shared needs .NET 6+; on older versions reuse one new Random() instance.",
    ],
    go: [
      "n := rand.IntN(10) + 1  // 1 to 10\nf := rand.Float64()     // 0.0 to < 1.0\nrand.Shuffle(len(items), func(i, j int) {\n    items[i], items[j] = items[j], items[i]\n})",
      "import \"math/rand/v2\" (Go 1.22+), seeded automatically. On older Go use math/rand and rand.Intn.",
    ],
    rust: [
      "use rand::Rng;\n\nlet mut rng = rand::rng();\nlet n = rng.random_range(1..=10);  // 1 to 10\nlet f: f64 = rng.random();         // 0.0 to < 1.0",
      "Needs the rand crate (cargo add rand). This is the rand 0.9 API; in 0.8 use rand::thread_rng() and gen_range.",
    ],
    ruby: [
      "n = rand(1..10)          # 1 to 10\nf = rand                 # 0.0 to < 1.0\nitem = %w[a b c].sample\nshuffled = [1, 2, 3].shuffle",
      "",
    ],
    php: [
      "$n = random_int(1, 10);  // 1 to 10, cryptographically secure\n$m = mt_rand(1, 10);     // faster, not secure\n\n$items = [\"a\", \"b\", \"c\"];\n$item = $items[array_rand($items)];",
      "",
    ],
    swift: [
      "let n = Int.random(in: 1...10)\nlet d = Double.random(in: 0..<1)\nlet item = [\"a\", \"b\", \"c\"].randomElement()  // Optional",
      "",
    ],
    kotlin: [
      "import kotlin.random.Random\n\nval n = Random.nextInt(1, 11)  // 1 to 10\nval r = (1..10).random()\nval item = listOf(\"a\", \"b\", \"c\").random()",
      "",
    ],
    bash: [
      "n=$(( RANDOM % 10 + 1 ))  # 1 to 10\necho \"$n\"\n\n# alternative with coreutils\nshuf -i 1-10 -n 1",
      "$RANDOM gives 0 to 32767.",
    ],
  },
  "lambda": {
    python: [
      "square = lambda x: x * x\nprint(square(4))\n\nnums = [1, 2, 3]\ndoubled = list(map(lambda n: n * 2, nums))\n\npairs = [(\"a\", 2), (\"b\", 1)]\npairs.sort(key=lambda p: p[1])",
      "Lambdas hold a single expression; PEP 8 prefers def over assigning a lambda to a name.",
    ],
    javascript: [
      "const square = (x) => x * x;\n\nconst doubled = [1, 2, 3].map((n) => n * 2);\nconst evens = [1, 2, 3, 4].filter((n) => n % 2 === 0);\n\n// anonymous function expression\nconst greet = function (name) {\n  return `Hello, ${name}`;\n};",
      "Arrow functions do not have their own this.",
    ],
    typescript: [
      "const square = (x: number): number => x * x;\nconst doubled = [1, 2, 3].map((n) => n * 2);\n\n// function type\ntype BinaryOp = (a: number, b: number) => number;\nconst add: BinaryOp = (a, b) => a + b;",
      "",
    ],
    java: [
      "Function<Integer, Integer> square = x -> x * x;\nSystem.out.println(square.apply(4));\n\nList<Integer> doubled = List.of(1, 2, 3).stream()\n        .map(n -> n * 2)\n        .toList();\n\nRunnable task = () -> System.out.println(\"running\");",
      "Function is in java.util.function. Stream.toList() needs Java 16+.",
    ],
    cpp: [
      "auto square = [](int x) { return x * x; };\nint result = square(4);\n\nint factor = 3;\nauto times = [factor](int x) { return x * factor; };  // capture by value\n\nstd::vector<int> v = {3, 1, 2};\nstd::sort(v.begin(), v.end(), [](int a, int b) { return a > b; });",
      "[&] captures everything by reference, [=] by value.",
    ],
    csharp: [
      "Func<int, int> square = x => x * x;\nConsole.WriteLine(square(4));\n\nvar nums = new List<int> { 1, 2, 3 };\nvar doubled = nums.Select(n => n * 2).ToList();\n\nAction<string> greet = name => Console.WriteLine($\"Hi {name}\");",
      "Func returns a value, Action does not. Select needs using System.Linq;.",
    ],
    go: [
      "square := func(x int) int {\n    return x * x\n}\nfmt.Println(square(4))\n\n// closure capturing a variable\ncount := 0\nincrement := func() { count++ }\nincrement()",
      "",
    ],
    rust: [
      "let square = |x: i32| x * x;\nprintln!(\"{}\", square(4));\n\nlet factor = 3;\nlet times = |x: i32| x * factor;  // captures factor\n\nlet doubled: Vec<i32> = vec![1, 2, 3].iter().map(|n| n * 2).collect();",
      "Use move |x| ... to take ownership of captured variables.",
    ],
    ruby: [
      "square = ->(x) { x * x }\nputs square.call(4)  # or square.(4) or square[4]\n\ndoubled = [1, 2, 3].map { |n| n * 2 }\nadd = lambda { |a, b| a + b }",
      "",
    ],
    php: [
      "$square = fn($x) => $x * $x;  // arrow function, PHP 7.4+\necho $square(4);\n\n$factor = 3;\n$times = function ($x) use ($factor) {\n    return $x * $factor;\n};\n\n$doubled = array_map(fn($n) => $n * 2, [1, 2, 3]);",
      "Arrow functions capture outer variables automatically; function () needs use (...).",
    ],
    swift: [
      "let square = { (x: Int) -> Int in x * x }\nprint(square(4))\n\nlet doubled = [1, 2, 3].map { $0 * 2 }\nlet sorted = [\"b\", \"a\"].sorted { $0 < $1 }",
      "",
    ],
    kotlin: [
      "val square = { x: Int -> x * x }\nprintln(square(4))\n\nval doubled = listOf(1, 2, 3).map { it * 2 }\nval add: (Int, Int) -> Int = { a, b -> a + b }",
      "it is the implicit name of a single lambda parameter.",
    ],
  },
  "main function": {
    python: [
      "def main():\n    print(\"Program starts here\")\n\n\nif __name__ == \"__main__\":\n    main()",
      "The guard keeps main() from running when the file is imported. Arguments are in sys.argv.",
    ],
    javascript: [
      "// Node.js runs the file top to bottom; a main function is just a convention\nfunction main() {\n  const args = process.argv.slice(2);\n  console.log(\"Program starts here\", args);\n}\n\nmain();",
      "",
    ],
    typescript: [
      "function main(): void {\n  const args: string[] = process.argv.slice(2);\n  console.log(\"Program starts here\", args);\n}\n\nmain();",
      "TypeScript has no special entry point; the file runs top to bottom.",
    ],
    java: [
      "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Program starts here\");\n    }\n}",
      "Save as Main.java. args holds the command-line arguments.",
    ],
    c: [
      "#include <stdio.h>\n\nint main(int argc, char *argv[]) {\n    printf(\"Program starts here (%d args)\\n\", argc - 1);\n    return 0;\n}",
      "argv[0] is the program name. Use int main(void) if you do not need arguments.",
    ],
    cpp: [
      "#include <iostream>\n\nint main(int argc, char* argv[]) {\n    std::cout << \"Program starts here (\" << argc - 1 << \" args)\\n\";\n    return 0;\n}",
      "",
    ],
    csharp: [
      "using System;\n\nclass Program\n{\n    static void Main(string[] args)\n    {\n        Console.WriteLine(\"Program starts here\");\n    }\n}",
      "C# 9+ / .NET 6+ also allows top-level statements with no Main at all.",
    ],
    go: [
      "package main\n\nimport \"fmt\"\n\nfunc main() {\n    fmt.Println(\"Program starts here\")\n}",
      "Must be in package main. Arguments are in os.Args.",
    ],
    rust: [
      "fn main() {\n    let args: Vec<String> = std::env::args().collect();\n    println!(\"Program starts here: {args:?}\");\n}",
      "",
    ],
    ruby: [
      "def main\n  puts \"Program starts here\"\nend\n\nmain if __FILE__ == $PROGRAM_NAME",
      "Ruby runs the file top to bottom; arguments are in ARGV.",
    ],
    php: [
      "<?php\n\nfunction main(array $argv): void {\n    echo \"Program starts here\\n\";\n}\n\nmain($argv);",
      "PHP runs top to bottom; main is only a convention. $argv is available in CLI scripts.",
    ],
    swift: [
      "@main\nstruct App {\n    static func main() {\n        print(\"Program starts here\")\n    }\n}",
      "Alternatively, code in a file named main.swift runs top to bottom (@main cannot be used there).",
    ],
    kotlin: [
      "fun main() {\n    println(\"Program starts here\")\n}\n\n// with command-line arguments:\n// fun main(args: Array<String>) { ... }",
      "",
    ],
    bash: [
      "#!/usr/bin/env bash\nset -euo pipefail\n\nmain() {\n    echo \"Program starts here: $*\"\n}\n\nmain \"$@\"",
      "set -euo pipefail stops the script on errors and unset variables.",
    ],
  },
  "hello world": {
    python: [
      "print(\"Hello, World!\")",
      "Run with: python3 hello.py",
    ],
    javascript: [
      "console.log(\"Hello, World!\");",
      "Run with: node hello.js",
    ],
    typescript: [
      "const message: string = \"Hello, World!\";\nconsole.log(message);",
      "Run with: npx tsx hello.ts (or compile with tsc, then run node).",
    ],
    java: [
      "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, World!\");\n    }\n}",
      "Save as Main.java and run: java Main.java (Java 11+).",
    ],
    c: [
      "#include <stdio.h>\n\nint main(void) {\n    printf(\"Hello, World!\\n\");\n    return 0;\n}",
      "Compile and run: gcc hello.c -o hello && ./hello",
    ],
    cpp: [
      "#include <iostream>\n\nint main() {\n    std::cout << \"Hello, World!\\n\";\n    return 0;\n}",
      "Compile and run: g++ hello.cpp -o hello && ./hello",
    ],
    csharp: [
      "Console.WriteLine(\"Hello, World!\");",
      "Top-level statement (.NET 6+). Create and run with: dotnet new console, then dotnet run.",
    ],
    go: [
      "package main\n\nimport \"fmt\"\n\nfunc main() {\n    fmt.Println(\"Hello, World!\")\n}",
      "Run with: go run hello.go",
    ],
    rust: [
      "fn main() {\n    println!(\"Hello, World!\");\n}",
      "Compile and run: rustc hello.rs && ./hello (or cargo run in a project).",
    ],
    ruby: [
      "puts \"Hello, World!\"",
      "Run with: ruby hello.rb",
    ],
    php: [
      "<?php\n\necho \"Hello, World!\\n\";",
      "Run with: php hello.php",
    ],
    swift: [
      "print(\"Hello, World!\")",
      "Run with: swift hello.swift",
    ],
    kotlin: [
      "fun main() {\n    println(\"Hello, World!\")\n}",
      "Compile and run: kotlinc hello.kt -include-runtime -d hello.jar && java -jar hello.jar",
    ],
    bash: [
      "#!/usr/bin/env bash\n\necho \"Hello, World!\"",
      "Make it executable with chmod +x hello.sh, then run ./hello.sh",
    ],
  },
};
