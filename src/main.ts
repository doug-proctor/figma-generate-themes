export default function () {

  const paintStyles = figma.getLocalPaintStyles().filter(paintStyle => !paintStyle.name.includes('Core/')).map(style => {
    const nameSegments = style.name.split('/')

    const id = style.id
    const theme = nameSegments[0]

    nameSegments.shift()
    const name = nameSegments.join('/')

    return { id, theme, name }
  })
  console.log(paintStyles)

  // Handling deleted tokens:
  // Each time we find a PaintStyle that's used by a token, we'll put its ID in this array. Then at the end,
  // we'll delete all PaintStyles that don't have their IDs in the array.
  const keepPaintStyles: string[] = []

  const definitions = figma.root.findAll(node => node.name.includes("Themes:"))

  if (definitions.length) {
    definitions.forEach(definition => {
      if ("findAll" in definition) {
        const tokens = definition.findAll((node: { name: string | string[]; }) => node.name.includes("token"))

        if (tokens.length) {
          const componentName = definition.name.split(":")[1]

          tokens.forEach(token => {

            let tokenName: string

            // Get the text layer child named "Label" and get its content:
            if ("findOne" in token) {
              const labelLayer = token.findOne((node: { name: string; }) => node.name === "Label")
              if (labelLayer && "characters" in labelLayer) {
                tokenName = formatTokenName(labelLayer.characters)
              }
            }

            // Get the swatches and their fill colours:
            if ("findAll" in token) {
              const swatchContainer = token.findAll((node: { name: string; }) => node.name === "Colours")[0]
              if (swatchContainer && "findAll" in swatchContainer) {
                const swatches = swatchContainer.findAll((node: { type: string; }) => node.type === "ELLIPSE")
                swatches.forEach((swatch, i) => {
                  if ("fills" in swatch) {
                    const fills: any = swatch.fills
                    const opacity = fills[0].opacity
                    const color = fills[0].color

                    createOrUpdateStyle(paintStyles, componentName, tokenName, swatch.name, color, opacity)
                  }
                })
              }
            }
          })
        }
      }
    })
  }

  // cleanup(keepPaintStyles) // not working yet

  figma.closePlugin()
}

const createOrUpdateStyle = (paintStyles: any, componentName: string, tokenName: string, themeName: string, color: any, opacity: number) => {

  // console.log(paintStyles, `${componentName}/${tokenName}`)
  const existingStyle = paintStyles.find((style: { name: string; theme: string }) => style.name === `${componentName}/${tokenName}` && style.theme === themeName)
  const style: PaintStyle = existingStyle ? figma.getStyleById(existingStyle.id) as PaintStyle : figma.createPaintStyle()

  if (style) {
    style.paints = [{ type: 'SOLID', color, opacity }];
    style.name = `${themeName}/${componentName}/${tokenName}`;
  }
}

// const cleanup = (keepPaintStyles: string[]) => {
  // console.log('cleanup before', figma.getLocalPaintStyles().length)
  // figma.getLocalPaintStyles()
  //     .filter(style => style.name.includes('Theme/'))
  //     .filter(style => !keepPaintStyles.includes(style.id))
  //     .forEach(style => style.remove())
  //
  // console.log('cleanup after', figma.getLocalPaintStyles().length)
// }

const formatTokenName = (name: string) => {
  // const joined = name.split(' ').join('')
  // return joined[0].toLowerCase() + joined.substring(1)
  return name
}