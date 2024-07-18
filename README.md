# WaxOnEdge Swap

![](preview.png)

The world's most powerful swap component powered by WaxOnEdge + NeftyBlocks.

the root of this project is for development of the component.

the source code is in `swap/`

check the [swap readme](./swap/README.md)

# Development

1. Install packages:

```bash
    $ pnpm i
```

2. Run develop:

```bash
    $ pnpm dev
```

go to [localhost:5173](http://localhost:5173/)

3. Build the library:
   this will build two versions: the swap with vue embedded and the swap without.

```bash
    $ pnpm build
```

### Publish

publishing to npm is done through GitHub actions, create a new tag with the last version and push it.

```bash
    $ git tag v0.0.0

    $ git push origin v0.0.0
```
