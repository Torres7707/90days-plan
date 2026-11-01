// **第 1 题：手写 `MyPick`**
// 写一个 `MyPick<T, K extends keyof T>`，效果和内置 `Pick` 一样。用它从一个有 4 个属性的类型里挑出 2 个。然后故意挑一个不存在的属性，看编辑器怎么提示。写完请说清楚：`K extends keyof T` 这一句限制了什么，去掉会怎样。

// **第 2 题：可选参数**
// 写一个函数 `f(opts?: { a?: number; b?: string })`，分别用 `f()`、`f({})`、`f({ c: 1 })` 调用。哪个会红，为什么？这和你今天问的 `useChat()` 为什么可以不传参是同一个道理。

// **第 3 题：泛型 `first`**
// 写 `first<T>(arr: T[]): T | undefined`。先不手写 `<T>` 调用，再手写 `<string>` 调用，用鼠标悬停确认两种情况下的返回类型。再试一下 `first<number>(["a"])`，看看会发生什么。


function f(opts?: { a?: number; b?: string }) {}

f();
f({});
f({ c: 1 });

const x = { a: 1, c: 1 };
f(x);

const y = { "a": 1};
f(y);

const z = { a: "1" };
f(z);