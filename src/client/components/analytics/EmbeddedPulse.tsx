import { TableauPulse } from '@tableau/embedding-api-react';

export type PulseLayout = 'default' | 'card' | 'ban';

const EmbeddedPulse: React.FC<{
  url: string | undefined,
  layout: PulseLayout,
  jwt: string,
  theme: 'light' | 'dark',
}> = ({ url, layout, jwt, theme }) => {


  const lightThemeParameters = [
    { name: "fontCssUrl", value: "https://fonts.googleapis.com/css2?family=Bebas+Neue&amp;display=swap" },
    { name: "fontSize", value: "18" },
    { name: "backgroundColor", value: "#fef" },
    { name: "backgroundColorOpaque", value: "" },
    { name: "foregroundColor", value: "#808" },
    { type: "chart", name: "axisGrid", value: "#808" },
    { type: "chart", name: "axisGridActive", value: "#808" },
    { type: "chart", name: "axisLabel", value: "#808" },
    { type: "chart", name: "bar", value: "#808" },
    { type: "chart", name: "barAverage", value: "#606" },
    { type: "chart", name: "barAxis", value: "#808" },
    { type: "chart", name: "barAxisLabel", value: "#808" },
    { type: "chart", name: "barCumulative", value: "#5B3C88" },
    { type: "chart", name: "barCumulativeLabel", value: "#5B3C88" },
    { type: "chart", name: "barFavorable", value: "#88BE88" },
    { type: "chart", name: "barLabel", value: "#808" },
    { type: "chart", name: "barLabelAverage", value: "#606" },
    { type: "chart", name: "barLabelFavorable", value: "#88BE88" },
    { type: "chart", name: "barLabelUnfavorable", value: "#AF3C4B" },
    { type: "chart", name: "barLabelUnspecified", value: "#875787" },
    { type: "chart", name: "barSum", value: "#875787" },
    { type: "chart", name: "barUnfavorable", value: "#AF3C4B" },
    { type: "chart", name: "barUnspecified", value: "#875787" },
    { type: "chart", name: "changeFavorable", value: "#88BE88" },
    { type: "chart", name: "changeUnfavorable", value: "#AF3C4B" },
    { type: "chart", name: "currentValue", value: "#fff" },
    { type: "chart", name: "currentValueDot", value: "#B200FF" },
    { type: "chart", name: "currentValueDotBorder", value: "#808" },
    { type: "chart", name: "dotBorder", value: "#808" },
    { type: "chart", name: "hoverDot", value: "#B200FF" },
    { type: "chart", name: "hoverLine", value: "#808" },
    { type: "chart", name: "line", value: "#808" },
    { type: "chart", name: "projection", value: "#468246" },
    { type: "chart", name: "range", value: "#fef" },
  ];

  const darkThemeParameters = [
    { name: "fontCssUrl", value: "https://fonts.googleapis.com/css2?family=Bebas+Neue&amp;display=swap" },
    { name: "fontSize", value: "18" },
    { name: "backgroundColor", value: "#022" },
    { name: "backgroundColorOpaque", value: "" },
    { name: "foregroundColor", value: "#cff" },
    { type: "chart", name: "axisGrid", value: "#022" },
    { type: "chart", name: "axisGridActive", value: "#022" },
    { type: "chart", name: "axisLabel", value: "#022" },
    { type: "chart", name: "bar", value: "#022" },
    { type: "chart", name: "barAverage", value: "#066" },
    { type: "chart", name: "barAxis", value: "#022" },
    { type: "chart", name: "barAxisLabel", value: "#022" },
    { type: "chart", name: "barCumulative", value: "#3498db" },
    { type: "chart", name: "barCumulativeLabel", value: "#3498db" },
    { type: "chart", name: "barFavorable", value: "#005B22" },
    { type: "chart", name: "barLabel", value: "#022" },
    { type: "chart", name: "barLabelAverage", value: "#066" },
    { type: "chart", name: "barLabelFavorable", value: "#005B22" },
    { type: "chart", name: "barLabelUnfavorable", value: "#9C2622" },
    { type: "chart", name: "barLabelUnspecified", value: "#4E4E59" },
    { type: "chart", name: "barSum", value: "#4E4E59" },
    { type: "chart", name: "barUnfavorable", value: "#9C2622" },
    { type: "chart", name: "barUnspecified", value: "#4E4E59" },
    { type: "chart", name: "changeFavorable", value: "#005B22" },
    { type: "chart", name: "changeUnfavorable", value: "#9C2622" },
    { type: "chart", name: "currentValue", value: "#fff" },
    { type: "chart", name: "currentValueDot", value: "#75D3FF" },
    { type: "chart", name: "currentValueDotBorder", value: "#022" },
    { type: "chart", name: "dotBorder", value: "#022" },
    { type: "chart", name: "hoverDot", value: "#75D3FF" },
    { type: "chart", name: "hoverLine", value: "#022" },
    { type: "chart", name: "line", value: "#022" },
    { type: "chart", name: "projection", value: "#007C16" },
    { type: "chart", name: "range", value: "#cff" },
  ]
  return (
    <div key={layout} style={{ height: '100%' }}>
      <TableauPulse
        src={url}
        token={jwt}
        layout={layout}
        themeParameters={theme === 'light' ? lightThemeParameters : darkThemeParameters}
      />
    </div>
  )

}

export default EmbeddedPulse;
