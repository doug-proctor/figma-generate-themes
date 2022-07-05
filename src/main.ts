export default function () {

  // Delete existing themes...
  figma.getLocalPaintStyles().filter(style => style.name.includes('Themes/')).forEach(style => style.remove())

  for (const node of figma.root.children) {
    if ("findAll" in node) {
      // @ts-ignore
      const themes: FrameNode[] = node.findAll((node: { type: string; name: string | string[]; }) => node.type === "FRAME" && node.name.includes("Theme:"))

      if (themes.length) {
        // console.log(`Found ${themes.length} themes`)

        themes.forEach(theme => {
          // @ts-ignore
          theme.children.map((token: EllipseNode) => {
            const themeName = theme.name.split(":")[1]
            const fills: any = token.fills
            const colorLight = fills[0].color

            // Create the light theme:
            const styleLight = figma.createPaintStyle();
            styleLight.paints = [{ type: 'SOLID', color: colorLight }];
            styleLight.name = `Themes/${themeName}/Light/${token.name}`;

            // Compute the dark theme:
            let styleObject = figma.getStyleById(token.fillStyleId as string)
            const styleName = styleObject?.name.split('/')

            if (styleName) {
              const invertedName = 1000 - parseInt(styleName[2],10)

              // get the target style by its name
              const paintStyles = figma.getLocalPaintStyles()
              const target = paintStyles.filter(style => style.name === `Base/${styleName[1]}/${invertedName}`)[0]
              const paints: any = target.paints
              const colorDark = paints[0].color

              // Create the dark theme
              const styleDark = figma.createPaintStyle();
              styleDark.paints = [{ type: 'SOLID', color: colorDark }];
              styleDark.name = `Themes/${themeName}/Dark/${token.name}`;
            }
          })
        })
      }
    }
  }

  figma.closePlugin();
}