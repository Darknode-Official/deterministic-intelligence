// Bundled training text for the statistical predictor. This is the ONLY thing the
// predictor learns from: plain, public-domain-style prose about computing and
// security. No weights, no model file — the predictor counts word frequencies in
// this string at load time. Grow this file and the predictions get better; that is
// the whole story, and it is inspectable by anyone reading it.
export const CORPUS = `
A computer program is a set of instructions that a machine can execute.
Programs are written in a programming language such as Python, JavaScript, Rust, Go, or Java.
A function takes input, performs a computation, and returns a result.
A variable stores a value that the program can read and change later.
A loop repeats a block of code until a condition becomes false.
A conditional statement runs one branch of code when a condition is true and another when it is false.
An array is an ordered list of values that you can index by position.
A string is a sequence of characters used to represent text.
An integer is a whole number, and a float is a number with a fractional part.
Data is stored in memory while the program runs and on disk when it must persist.
A database stores data so that it can be queried, updated, and retrieved efficiently.
A query asks the database for the rows that match a condition.
An algorithm is a step by step procedure for solving a problem.
Sorting arranges a list of values in order, and searching finds a value in a list.
Recursion is when a function calls itself to solve a smaller version of the problem.
The time complexity of an algorithm describes how its running time grows with input size.
A hash function maps input data to a fixed size value called a hash.
Encryption protects data by transforming it into a form that only an authorized party can read.
A key is a secret value used to encrypt and decrypt data.
Authentication proves who a user is, and authorization decides what that user is allowed to do.
A password should be long, unique, and stored only as a salted hash, never in plain text.
A firewall filters network traffic and blocks connections that are not allowed.
A port is a numbered endpoint that a service listens on for incoming connections.
The domain name system translates human readable names into numeric addresses.
A protocol is a set of rules that two computers agree on so they can communicate.
The hypertext transfer protocol carries requests and responses between a browser and a server.
A request contains a method, a path, headers, and sometimes a body.
A response contains a status code, headers, and a body with the requested data.
A server waits for requests and sends back responses to each client that connects.
A client sends a request to a server and waits for the response to arrive.
A vulnerability is a weakness that an attacker can exploit to compromise a system.
An exploit is code that takes advantage of a vulnerability to gain access or control.
A patch is an update that fixes a vulnerability and improves the security of the software.
Reconnaissance gathers information about a target before an attack is attempted.
A scan probes a network to discover which hosts are alive and which ports are open.
Cross site scripting injects malicious script into a page that other users then load.
Structured query language injection tricks a database into running commands from user input.
Input validation checks that data is well formed before the program trusts and uses it.
Defense in depth layers many controls so that one failure does not compromise the whole system.
The principle of least privilege gives each user and process only the access it truly needs.
Logging records what the system did so that an operator can review events after they happen.
Monitoring watches a system in real time and raises an alert when something looks wrong.
A backup is a copy of data that can restore the system after loss or corruption.
Testing checks that the code behaves the way the specification says it should.
A unit test verifies that a small piece of code returns the correct result for a given input.
Debugging is the process of finding and fixing the cause of a defect in a program.
Version control records the history of a project so that changes can be reviewed and undone.
A commit saves a snapshot of the project with a message describing what changed.
A branch lets you develop a change in isolation before merging it back into the main line.
Documentation explains how to use the software so that other people can understand it.
The goal is to write code that is correct, clear, and easy for other people to maintain.
Good code is simple, well named, tested, and does exactly what the specification requires.
The engine generates code from a specification and then verifies the result with tests.
It predicts the most likely next word by counting how often words follow each other.
It gives a full written answer drawn only from sources it can cite and computations it can prove.
Every answer is deterministic, reproducible, and free, and it runs entirely on your own device.
The tool does not use a neural network, and it does not send your data to any server.
When a request is specific, the engine builds the result from scratch and tests that it is correct.
When a request is vague, the engine asks a clarifying question instead of guessing what you meant.
The system is honest about what it can do and clear about the limits of what it cannot do.
A list comprehension builds a new list by transforming each element of an existing list.
A dictionary maps keys to values so that a value can be looked up quickly by its key.
A set stores unique values and can test membership in constant time on average.
A stack is a last in first out structure where you push and pop from the same end.
A queue is a first in first out structure where you add at one end and remove from the other.
A tree is a hierarchy of nodes where each node has a parent and zero or more children.
A graph is a set of nodes connected by edges that can model networks and relationships.
Binary search finds a value in a sorted array by repeatedly halving the search range.
Merge sort divides the list in half, sorts each half, and merges the two sorted halves.
Quick sort picks a pivot, partitions the list around it, and sorts the two partitions.
A pointer holds the address of a value in memory rather than the value itself.
Memory that is allocated must eventually be freed or the program will leak memory.
Garbage collection reclaims memory that the program can no longer reach.
A thread is a single sequence of execution, and many threads can run at the same time.
A race condition happens when the result depends on the unpredictable timing of threads.
A lock prevents two threads from changing the same data at the same time.
Concurrency is about dealing with many things at once, and parallelism is about doing them at once.
A cache stores the result of an expensive operation so it can be reused without recomputing.
An index speeds up a query by letting the database find rows without scanning the whole table.
A transaction groups several operations so they either all succeed or all fail together.
A foreign key links a row in one table to a row in another table.
Normalization organizes data to reduce redundancy and improve integrity.
An application programming interface defines how one program can talk to another.
A representational state transfer interface uses standard methods over resources named by a path.
A token proves that a request comes from an authenticated user without sending the password again.
A session keeps track of a logged in user across many requests to the same server.
A cookie stores a small piece of data in the browser and sends it back on each request.
The same origin policy stops a page from reading data from a different origin.
Cross origin resource sharing lets a server allow requests from other origins on purpose.
A content security policy tells the browser which sources of script and style it may load.
A man in the middle attack intercepts and may alter traffic between two parties.
Transport layer security encrypts the connection so that traffic cannot be read or changed.
A certificate binds a public key to an identity and is signed by a trusted authority.
Public key cryptography uses a public key to encrypt and a private key to decrypt.
A digital signature proves that a message came from the holder of a private key.
A salt is random data added to a password before hashing so that equal passwords hash differently.
Rate limiting caps how many requests a client can make in a period of time.
A denial of service attack tries to exhaust a resource so that real users cannot be served.
Fuzzing feeds a program random or malformed input to find crashes and vulnerabilities.
A buffer overflow writes past the end of a buffer and can corrupt memory or hijack control.
Static analysis inspects code without running it, and dynamic analysis observes it while it runs.
An intrusion detection system watches for signs of an attack and raises an alert.
A security operations center monitors, detects, and responds to threats around the clock.
The mean is the sum of the values divided by how many values there are.
The median is the middle value when the values are sorted in order.
The mode is the value that appears most often in the data.
Variance measures how far the values spread out from the mean.
The standard deviation is the square root of the variance.
A probability is a number between zero and one that measures how likely an event is.
A function is continuous if small changes in the input cause small changes in the output.
The derivative of a function measures how fast its output changes as its input changes.
An equation states that two expressions are equal, and solving it finds the unknown value.
A prime number is a whole number greater than one whose only divisors are one and itself.
The greatest common divisor is the largest number that divides two numbers without a remainder.
A color can be written as a hex code, as red green and blue values, or as hue saturation and lightness.
A hexadecimal number uses sixteen digits, from zero to nine and then a to f.
A binary number uses only two digits, zero and one, and each place is a power of two.
To convert a number to another base, divide repeatedly and read the remainders in reverse.
Data is often stored as comma separated values, where each line is a row and each field is separated by a comma.
A column of numbers can be summarized by its count, sum, mean, minimum, and maximum.
A well written function does one thing, has a clear name, and is easy to test.
Every answer this engine gives can be reproduced, because the same input always produces the same output.
The engine reads your request, decides which skill fits best, and shows how confident it is.
It never sends your data anywhere, and it never invents a fact it cannot support.
Good software is built from small, well tested pieces that fit together cleanly.
Reading code is more common than writing it, so clarity matters more than cleverness.
The best way to understand a program is to run it, test it, and read its output carefully.

A programming language gives a precise way to describe computation to a machine.
Every language has a syntax, which is the set of rules for how programs are written, and a semantics, which is what those programs mean when they run.
A compiler translates source code into machine code ahead of time, while an interpreter reads and executes the source directly.
Just in time compilation blends the two by translating hot paths into machine code while the program runs.
A statement performs an action, and an expression produces a value, and most languages are built from both.
A data type describes the kind of value a piece of data holds, such as an integer, a floating point number, a boolean, a character, or a string.
Static typing checks types before the program runs, while dynamic typing checks them as the program runs.
Strong typing refuses to mix incompatible types silently, while weak typing coerces them without complaint.
An array stores a fixed sequence of elements in contiguous memory, and access by index takes constant time.
A linked list stores each element in a node that points to the next, so insertion is cheap but random access is slow.
A stack is a last in first out structure, and a queue is a first in first out structure, and both appear everywhere in real systems.
A hash map stores key value pairs and finds any key in roughly constant time by hashing it to a bucket.
A tree is a hierarchy of nodes with a single root, and a graph is a set of nodes connected by edges that may form cycles.
Recursion solves a problem by reducing it to a smaller version of itself, and every recursion needs a base case that stops the descent.
Iteration solves the same problems with a loop, and many recursive functions can be rewritten as loops to save stack space.
Sorting arranges elements in order, and merge sort and quick sort both run in order n log n time on average.
Searching finds an element in a collection, and binary search finds it in order log n time when the collection is already sorted.
The time complexity of an algorithm describes how its running time grows as the input grows, and we write it with big O notation.
The space complexity describes how much extra memory it needs as the input grows.
A good algorithm is correct first and fast second, because a fast wrong answer is still wrong.

Memory is organized as a long sequence of bytes, and each byte has an address.
The stack holds local variables and grows and shrinks as functions are called and return.
The heap holds values whose lifetime is not tied to a single function, and the program must manage them or let a garbage collector reclaim them.
A pointer is a value that holds an address, and dereferencing it reads or writes the value stored there.
A memory leak happens when a program keeps memory it no longer needs, and over time the leak can exhaust the available memory.
A buffer overflow happens when a program writes past the end of a buffer, and it can corrupt data or let an attacker run code.
Concurrency is about dealing with many things at once, and parallelism is about doing many things at once.
A thread is a single sequence of execution, and a process is a program with its own memory and one or more threads.
A race condition happens when the result depends on the unpredictable timing of concurrent operations on shared state.
A lock lets only one thread enter a critical section at a time, and a deadlock happens when two threads each wait for a lock the other holds.
An atomic operation completes without any other thread observing a partial result, and it is the building block of lock free code.

The internet is a network of networks that speak a common family of protocols.
The internet protocol routes packets from one address to another, and the transmission control protocol turns those packets into a reliable ordered stream.
A domain name is a human friendly name that the domain name system translates into a numeric address.
The hypertext transfer protocol is how a browser asks a server for a page and how the server answers.
When the protocol runs over transport layer security the connection is encrypted and the server proves its identity with a certificate.
A request has a method, a path, headers, and sometimes a body, and a response has a status code, headers, and a body.
A status code in the two hundreds means success, a code in the three hundreds means redirect, a code in the four hundreds means the client made a mistake, and a code in the five hundreds means the server failed.
An application programming interface is a contract that lets one program use another, and a web api exposes that contract over the network.
A representational state transfer api models the world as resources and uses standard methods to read and change them.
A cache stores the result of expensive work so that the next request for the same thing is fast, and the hard part is knowing when the cached copy is stale.
A load balancer spreads incoming requests across several servers so that no single server is overwhelmed.
A database stores data so that it can be queried and changed reliably, and a relational database organizes data into tables of rows and columns.
The structured query language lets you select, insert, update, and delete rows, and a well chosen index makes a query fast.
A transaction groups several changes so that they all succeed or all fail together, which keeps the data consistent.

Security is the practice of protecting systems, data, and people from harm.
Confidentiality keeps data secret, integrity keeps it correct, and availability keeps it reachable, and together they are the core goals.
Authentication proves who you are, and authorization decides what you are allowed to do.
A password should be long and unique, and a password manager makes that practical, and two factor authentication adds a second proof of identity.
Encryption turns readable data into ciphertext that only a holder of the key can read, and it protects data both in transit and at rest.
Symmetric encryption uses one shared key, and asymmetric encryption uses a public key to encrypt and a private key to decrypt.
A hash function maps data of any size to a fixed size digest, and a good hash is fast to compute and hard to reverse.
A digital signature proves that a message came from the holder of a private key and was not changed on the way.
The principle of least privilege says that every account and process should have only the access it needs and no more.
Defense in depth layers several controls so that if one fails the others still protect the system.
A vulnerability is a weakness, an exploit is code that abuses it, and a patch is the fix that removes it.
Threat modeling asks what can go wrong, what we are doing about it, and whether that is enough.
Cross site scripting injects untrusted script into a page, and it is stopped by escaping output and setting a strong content security policy.
Structured query language injection sends untrusted input into a query, and it is stopped by using parameterized queries.
Phishing tricks a person into revealing a secret, and training and strong authentication reduce the damage it can do.
The best security is built in from the start, tested continuously, and assumes that any single control can fail.

Mathematics is the study of number, structure, space, and change.
A prime number has exactly two divisors, one and itself, and every whole number greater than one is a product of primes in exactly one way.
The greatest common divisor of two numbers is the largest number that divides both, and the euclidean algorithm finds it quickly.
A function maps each input to exactly one output, and its graph is the set of points that satisfy it.
A linear equation has a straight line for its graph, and a quadratic equation has a parabola.
The derivative of a function measures how fast it changes, and the integral measures the area under its curve.
A probability is a number between zero and one that measures how likely an event is, and the probabilities of all outcomes sum to one.
The mean is the average of a set of numbers, the median is the middle value, and the mode is the value that appears most often.
The standard deviation measures how spread out the numbers are around the mean.
A vector has both a magnitude and a direction, and a matrix is a rectangular grid of numbers that can transform vectors.
The determinant of a matrix tells you whether it can be inverted and how it scales area or volume.

Writing clear code is an act of communication with the people who will read it later, including your future self.
Choose names that say what a thing is or does, keep functions short and focused, and delete code that no longer earns its place.
A comment should explain why the code does something, not restate what the code already says.
Write the test first when you can, because a test describes the behavior you want before you build it.
When a program misbehaves, reproduce the problem, form a hypothesis, change one thing, and observe the result.
Read the error message carefully, because it usually says exactly what went wrong and where.
Version control records the history of a project so that you can see what changed, when, and why, and undo a change safely.
A small commit with a clear message is easier to review, easier to revert, and easier to understand a year later.
Automate the boring parts, because a machine does not get tired and does not forget a step.
Measure before you optimize, because intuition about performance is often wrong, and the slow part is rarely where you expect.
Simple designs are easier to build, easier to test, and easier to change than clever ones.
The goal is not to write code that works once, but to write code that keeps working as the world around it changes.

`;
