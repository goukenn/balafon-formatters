## algorithm
- check custom-property       -> attribute-value - only - ok
- check class or id           -> block selector  - only - ok
- check tag                   -> block selector
- check tag name (with event) -> block selector - cibling (namespace tag)
- check tag name (with sub)   -> block selector 
- check css property (with sub)   -> block selector
- check css property (with event) -> block selector - cibling (namespace tag)

- check css property          -> attribute-value / block selector (consider as tag)

## sub consist of class or id or :speudo 

```css
body{}
body: red : a banis
--body: red
--p
background-color: red
color

```