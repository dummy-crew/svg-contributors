# svg-contributors

Generate contributors svg from github repository using cli

## Installation

```bash
npm i svg-contributors -g
```

## Example

```bash
dummysvg -o vuejs -n vue
# output: contributors.svg
```

## Options

```
-o, --owner Repository owner
-n, --name Repository name
-s, --size Size of the avatar
-l, --limit Limit of the contributors
```

## Configuration
`owner`
- Type: string

`name`
- Type: string

`size`
- Default: 60
- Type: number

`limit`
- Default: 30
- Type: number

## Output
<p align="center">
    <img src="./contributors.svg" alt="Contributors">
<p>
