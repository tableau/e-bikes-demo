import { useAppContext } from '../../App';
import { getJwtFromServer } from './jwt';

export function usePulseApi() {

  const { user } = useAppContext();

  async function getInsightMarkup() {

    if (!user) {
      return null;
    }

    const server = 'https://10ay.online.tableau.com';
    const site = 'ehofman';
    const metric = '7d8fe39a-7bf9-424c-bdd3-2676a5598c50';
    const jwt = await getJwtFromServer(user);

    const url = `http://localhost:5001/api/-/pulse/insights/ban?server=${server}&site=${site}&jwt=${jwt}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(banBody),
    });

    const json = await response.json();

    return json.bundle_response.result.insight_groups[0].insights[0].result.markup;

  }

  const banBody = {
    "bundle_request": {
      "version": 1,
      "options": {
        "output_format": "OUTPUT_FORMAT_HTML",
        "time_zone": "Etc/UTC"
      },
      "input": {
        "metadata": {
          "name": "Bike returns",
          "metric_id": "7d8fe39a-7bf9-424c-bdd3-2676a5598c50",
          "definition_id": "907e21dd-1baf-49cb-ac47-ccce5250a707"
        },
        "metric": {
          "definition": {
            "datasource": {
              "id": "ff397ea3-24eb-4c54-b0fc-fa46a9735b13"
            },
            "viz_state_specification": {
              "viz_state_string": "{\"vizState\":{\"rows\":[{\"fieldOnShelf\":{\"component\":[\"usr:Calculation_14003446872543287:qk\"]},\"fieldCaption\":\"AGG(Calculation_14003446872543287)\"}],\"columns\":[{\"fieldOnShelf\":{\"component\":[\"tdy:Order Placed Date:qk\"]},\"fieldCaption\":\"DAY(Order Placed Date)\"}],\"defaultEncoding\":{}},\"dataModel\":{\"dataSource\":[{\"columnsToAdd\":[{\"name\":{\"component\":[\"Calculation_14003446872543287\"]},\"fieldType\":\"FIELD_TYPE_CONTINUOUS\",\"vtagg\":\"VISUAL_TOTAL_AGGREGATION_VTAGG_DEFAULT\",\"pivotStrategy\":\"FIELD_PIVOT_STRATEGY_PIVOT_ON_KEY\",\"role\":\"FIELD_ROLE_MEASURE\",\"dataType\":\"DATA_TYPE_INTEGER_TYPE\",\"calc\":{\"formula\":\"SUM(if [Return Flag] = \\\"Yes\\\" then [Units] else 0 end)\"},\"fiscalYearStart\":\"FISCAL_YEAR_START_JANUARY\"},{\"name\":{\"component\":[\"tdy:Order Placed Date:qk\"]},\"fieldType\":\"FIELD_TYPE_CONTINUOUS\",\"vtagg\":\"VISUAL_TOTAL_AGGREGATION_VTAGG_DEFAULT\",\"pivotStrategy\":\"FIELD_PIVOT_STRATEGY_PIVOT_ON_KEY\",\"role\":\"FIELD_ROLE_DIMENSION\",\"dataType\":\"DATA_TYPE_DATETIME_TYPE\",\"instance\":{\"baseColumn\":{\"component\":[\"Order Placed Date\"]},\"agg\":\"AGG_TYPE_TRUNC_DAY\"}},{\"name\":{\"component\":[\"usr:Calculation_14003446872543287:qk\"]},\"fieldType\":\"FIELD_TYPE_CONTINUOUS\",\"vtagg\":\"VISUAL_TOTAL_AGGREGATION_VTAGG_DEFAULT\",\"pivotStrategy\":\"FIELD_PIVOT_STRATEGY_PIVOT_ON_KEY\",\"role\":\"FIELD_ROLE_MEASURE\",\"dataType\":\"DATA_TYPE_INTEGER_TYPE\",\"instance\":{\"baseColumn\":{\"component\":[\"Calculation_14003446872543287\"]},\"agg\":\"AGG_TYPE_USER\"}}],\"contextSpecification\":{\"sampleCount\":-1,\"sampleUnits\":\"SORT_UNITS_RECORDS\",\"normalization\":\"EXTRACT_NORMALIZATION_DENORMALIZED\"},\"name\":\"sqlproxy.0neaa2z1qzub351dumtzj1548xdh\",\"displayMemberAliases\":true}]}}"
            },
            "is_running_total": false
          },
          "metric_specification": {
            "filters": [],
            "measurement_period": {
              "granularity": "GRANULARITY_BY_MONTH",
              "range": "RANGE_CURRENT_PARTIAL"
            },
            "comparison": {
              "comparison": "TIME_COMPARISON_YEAR_AGO_PERIOD"
            }
          },
          "extension_options": {
            "allowed_dimensions": [
              "Account State",
              "Battery Type",
              "Loyalty Status",
              "Product Name"
            ],
            "allowed_granularities": []
          },
          "representation_options": {
            "type": "NUMBER_FORMAT_TYPE_NUMBER",
            "number_units": {
              "singular_noun": "",
              "plural_noun": ""
            },
            "sentiment_type": "SENTIMENT_TYPE_DOWN_IS_GOOD",
            "row_level_id_field": {
              "identifier_col": "",
              "identifier_label": ""
            },
            "row_level_entity_names": {
              "entity_name_singular": "",
              "entity_name_plural": ""
            }
          },
          "insights_options": {
            "show_insights": true,
            "settings": [
              {
                "type": "INSIGHT_TYPE_RISKY_MONOPOLY",
                "disabled": false
              },
              {
                "type": "INSIGHT_TYPE_TOP_DRIVERS",
                "disabled": false
              },
              {
                "type": "INSIGHT_TYPE_CURRENT_TREND",
                "disabled": false
              },
              {
                "type": "INSIGHT_TYPE_BOTTOM_CONTRIBUTORS",
                "disabled": true
              },
              {
                "type": "INSIGHT_TYPE_TOP_DETRACTORS",
                "disabled": true
              },
              {
                "type": "INSIGHT_TYPE_NEW_TREND",
                "disabled": false
              }
            ]
          }
        }
      }
    }
  }



  return { getInsightMarkup };

}