import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { VegaLite } from 'react-vega';

interface AIAssistentDataVisuzliationProps {
  toolResults: any[];
  responseContent?: string;
}

interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'groupedBar';
  data: any[];
  title: string;
  xKey?: string;
  yKey?: string;
  nameKey?: string;
  valueKey?: string;
  seriesKey?: string; // For grouping different colored bars
  groupedData?: any[]; // For grouped bar chart data
  isCurrency?: boolean; // Whether the main metric represents currency
}

const COLORS = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6c757d', '#17a2b8', '#fd7e14', '#6f42c1'];

function AIAssistentDataVisuzliation({ toolResults, responseContent }: AIAssistentDataVisuzliationProps) {
  
  // Function to extract Vega-Lite specifications from Pulse tool results
  const extractVegaLiteSpecs = (toolResults: any[]) => {
    const vegaSpecs: Array<{ spec: any; title: string }> = [];
    
    toolResults.forEach((result) => {
      // ONLY extract from generate-pulse-metric-value-insight-bundle tool results
      // These are the only ones that contain actual Vega-Lite visualizations
      if (result.tool === 'generate-pulse-metric-value-insight-bundle' && result.result) {
        result.result.forEach((item: any) => {
          if (item.type === 'text' && item.text) {
            try {
              // Parse the JSON response from Pulse
              const parsed = JSON.parse(item.text);
              
              // Navigate through the Pulse response structure to find Vega-Lite specs
              if (parsed.bundle_response?.result?.insight_groups) {
                parsed.bundle_response.result.insight_groups.forEach((group: any) => {
                  if (group.insights) {
                    group.insights.forEach((insight: any) => {
                      if (insight.result?.viz && insight.result.viz.$schema) {
                        
                        // Found a Vega-Lite specification
                        const cleanTitle = insight.result.markup ? 
                          insight.result.markup.replace(/<[^>]*>/g, '').trim() : // Strip HTML tags
                          'Business Metric Visualization';
                        
                        const finalTitle = cleanTitle.includes('was') ? 
                          cleanTitle.split('was')[0].trim() + ' Trend' : 
                          cleanTitle;
                        
                        vegaSpecs.push({
                          spec: insight.result.viz,
                          title: finalTitle
                        });
                      }
                    });
                  }
                });
              }
            } catch (e) {
              console.error('❌ PULSE JSON parsing failed:', e);
            }
          }
        });
      }
    });
    
    return vegaSpecs;
  };
  
  // Determine if a field represents currency/monetary values
  const isCurrencyField = (fieldName: string): boolean => {
    const currencyKeywords = [
      'sales', 'revenue', 'profit', 'income', 'cost', 'price', 'amount', 
      'total sales', 'gross', 'net', 'value', 'margin', 'budget', 'spending'
    ];
    const lowerField = fieldName.toLowerCase();
    return currencyKeywords.some(keyword => lowerField.includes(keyword));
  };

  // Smart number formatter based on field type
  const formatNumber = (value: number, fieldName: string, useShortForm: boolean = true): string => {
    if (isCurrencyField(fieldName)) {
      // Currency formatting
      if (useShortForm) {
        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
        return `$${value.toLocaleString()}`;
      } else {
        return `$${value.toLocaleString()}`;
      }
    } else {
      // Non-currency formatting (counts, returns, etc.)
      if (useShortForm) {
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
        return value.toLocaleString();
      } else {
        return value.toLocaleString();
      }
    }
  };

  const parseMarkdownTable = (text: string): any[] | null => {
    try {
      // Find markdown table pattern
      const tableRegex = /\|(.+)\|\s*\n\s*\|[\s\-\|:]+\|\s*\n((?:\s*\|.+\|\s*\n?)+)/g;
      const match = tableRegex.exec(text);
      
      if (!match) return null;
      
      const headerRow = match[1];
      const dataRows = match[2];
      
      // Parse headers
      const headers = headerRow.split('|')
        .map(h => h.trim())
        .filter(h => h.length > 0);
      
      if (headers.length === 0) return null;
      
      // Parse data rows
      const rows = dataRows.split('\n')
        .filter(row => row.trim().length > 0)
        .map(row => {
          const cells = row.split('|')
            .map(cell => cell.trim())
            .filter((cell, index, arr) => {
              // Filter out empty cells at start/end from pipe formatting
              return !(cell === '' && (index === 0 || index === arr.length - 1));
            });
          
          const rowObj: any = {};
          headers.forEach((header, index) => {
            if (index < cells.length) {
              let value = cells[index];
              
              // Clean up common formatting
              if (value.startsWith('$')) {
                // Remove $ and convert to number
                const numValue = parseFloat(value.replace(/[$,]/g, ''));
                rowObj[header] = isNaN(numValue) ? value : numValue;
              } else if (!isNaN(Number(value)) && value !== '') {
                // Convert pure numbers
                rowObj[header] = Number(value);
              } else {
                // Keep as string
                rowObj[header] = value;
              }
            }
          });
          
          return rowObj;
        })
        .filter(row => Object.keys(row).length > 0);
      
      return rows.length > 0 ? rows : null;
    } catch (error) {
      console.warn('Error parsing markdown table:', error);
      return null;
    }
  };

  const parseTableData = (content: any): any[] | null => {
    if (!content) return null;

    try {
      // Handle MCP tool result structure: [{type: "text", text: "JSON_STRING"}]
      if (Array.isArray(content) && content.length > 0 && content[0].type === 'text' && content[0].text) {
        try {
          const parsed = JSON.parse(content[0].text);
          return parseTableData(parsed);
        } catch (parseError) {
          console.warn('Error parsing MCP tool result text:', parseError);
          return null;
        }
      }

      // Handle different possible data structures
      if (Array.isArray(content)) {
        return content.length > 0 ? content : null;
      }

      if (typeof content === 'object') {
        // Tableau-specific structures
        if (content.tuples && Array.isArray(content.tuples)) {
          return content.tuples;
        }

        if (content.data && Array.isArray(content.data)) {
          return content.data;
        }
        
        if (content.rows && Array.isArray(content.rows)) {
          return content.rows;
        }

        if (content.results && Array.isArray(content.results)) {
          return content.results;
        }

        // Handle Tableau column-based format
        if (content.columns && content.data) {
          const columns = content.columns;
          const data = content.data;
          
          if (Array.isArray(columns) && Array.isArray(data)) {
            return data.map((row: any[]) => {
              const obj: any = {};
              columns.forEach((col: string, index: number) => {
                obj[col] = row[index];
              });
              return obj;
            });
          }
        }

        // Check if it's a single row object
        if (Object.keys(content).length > 0 && !Array.isArray(content)) {
          return [content];
        }
      }

      // Try to parse if it's a string
      if (typeof content === 'string') {
        try {
          const parsed = JSON.parse(content);
          return parseTableData(parsed);
        } catch {
          // Check if it's CSV-like format
          const lines = content.split('\n').filter(line => line.trim());
          if (lines.length > 1) {
            const headers = lines[0].split(',').map(h => h.trim());
            const data = lines.slice(1).map(line => {
              const values = line.split(',').map(v => v.trim());
              const obj: any = {};
              headers.forEach((header, index) => {
                if (index < values.length) {
                  const value = values[index];
                  // Try to parse as number
                  const numValue = parseFloat(value);
                  obj[header] = isNaN(numValue) ? value : numValue;
                }
              });
              return obj;
            });
            return data.length > 0 ? data : null;
          }
        }
      }

      return null;
    } catch (error) {
      console.warn('Error parsing table data:', error);
      return null;
    }
  };

  const detectChartType = (data: any[]): ChartData | null => {
    if (!data || data.length === 0) return null;

    const firstRow = data[0];
    const keys = Object.keys(firstRow);
    
    if (keys.length < 2) return null;

    // Find numeric columns with more robust detection
    const numericKeys = keys.filter(key => {
      const values = data.map(row => row[key]).filter(v => v !== null && v !== undefined && v !== '');
      if (values.length === 0) return false;
      
      return values.some(value => {
        if (typeof value === 'number') return true;
        if (typeof value === 'string') {
          // Remove common formatting (commas, dollar signs, etc.)
          const cleaned = value.replace(/[$,\s%]/g, '');
          return !isNaN(Number(cleaned)) && cleaned !== '';
        }
        return false;
      });
    });

    // Enhanced date/time detection
    const dateKeys = keys.filter(key => {
      // First check if the field name itself suggests it's a date/time field
      const isDateFieldName = /date|time|year|month|quarter|period|day|week/i.test(key);
      
      if (isDateFieldName) {
        // If field name suggests date, check if values look like dates/years
        return data.some(row => {
          const value = row[key];
          if (typeof value === 'number') {
            // Check if it's a reasonable year range
            return value >= 1900 && value <= 2100;
          }
          if (typeof value === 'string') {
            // Check various date formats
            return (
              /^\d{4}$/.test(value) || // Year only (2022, 2023, etc.)
              /\d{4}-\d{2}-\d{2}/.test(value) || // YYYY-MM-DD
              /\d{1,2}\/\d{1,2}\/\d{4}/.test(value) || // MM/DD/YYYY
              /\d{4}-\d{2}/.test(value) || // YYYY-MM
              /\w+ \d{4}/.test(value) || // Month Year
              /Q[1-4] \d{4}/.test(value) // Quarter format
            );
          }
          return false;
        });
      }
      
      // If field name doesn't suggest date, check if values look like dates
      return data.some(row => {
        const value = row[key];
        if (typeof value !== 'string') return false;
        
        return (
          /\d{4}-\d{2}-\d{2}/.test(value) || // YYYY-MM-DD
          /\d{1,2}\/\d{1,2}\/\d{4}/.test(value) || // MM/DD/YYYY
          /\d{4}-\d{2}/.test(value) || // YYYY-MM
          /^\d{4}$/.test(value) || // Year only
          /\w+ \d{4}/.test(value) || // Month Year
          /Q[1-4] \d{4}/.test(value) // Quarter format
        );
      });
    });

    // Find categorical columns
    const categoricalKeys = keys.filter(key => 
      !numericKeys.includes(key) && !dateKeys.includes(key)
    );

    // Smart chart type selection with date field priority
    let chartType: 'line' | 'bar' | 'pie' | 'groupedBar' = 'bar';
    let xKey = keys[0];
    let yKey = numericKeys[0];
    let seriesKey: string | undefined;

    // Prefer specific business-relevant columns for eBikes demo
    const salesColumns = numericKeys.filter(key => 
      /sales|revenue|amount|total|quantity|count|profit/i.test(key)
    );
    const timeColumns = dateKeys.filter(key => 
      /date|time|year|month|quarter|period/i.test(key)
    );
    const categoryColumns = categoricalKeys.filter(key => 
      /product|category|type|name|region|customer|model/i.test(key)
    );

    // PRIORITY 1: Date field on X-axis - ALWAYS use date fields for x-axis when available
    if (timeColumns.length > 0 && numericKeys.length > 0) {
      xKey = timeColumns[0]; // Always use date field for x-axis
      yKey = salesColumns.length > 0 ? salesColumns[0] : numericKeys[0]; // Prefer sales columns for y-axis
      
      // If we have categorical data in addition to date + numeric, use grouped bars
      if (categoryColumns.length > 0 && salesColumns.length > 0) {
        chartType = 'groupedBar';
        seriesKey = categoryColumns[0];

        // Clean and process data first
        const cleanedData = data.map(row => {
          const cleanedRow = { ...row };
          if (cleanedRow[yKey] !== null && cleanedRow[yKey] !== undefined) {
            const rawValue = String(cleanedRow[yKey]);
            cleanedRow[yKey] = parseFloat(rawValue.replace(/[$,\s%]/g, '')) || 0;
          }
          return cleanedRow;
        }).filter(row => row[xKey] !== null && row[xKey] !== undefined);

        // Sort by date field for proper chronological order
        cleanedData.sort((a, b) => {
          const aValue = a[xKey];
          const bValue = b[xKey];
          
          if (typeof aValue === 'number' && typeof bValue === 'number') {
            return aValue - bValue;
          }
          
          if (typeof aValue === 'string' && typeof bValue === 'string') {
            const aDate = new Date(aValue);
            const bDate = new Date(bValue);
            
            if (isNaN(aDate.getTime()) || isNaN(bDate.getTime())) {
              return aValue.localeCompare(bValue);
            }
            
            return aDate.getTime() - bDate.getTime();
          }
          
          return String(aValue).localeCompare(String(bValue));
        });

        // Transform data for grouped bar chart
        const groupedMap = new Map();
        
        cleanedData.forEach(row => {
          const xValue = String(row[xKey]);
          const seriesValue = String(row[seriesKey!]);
          const yValue = row[yKey];
          
          if (!groupedMap.has(xValue)) {
            groupedMap.set(xValue, { [xKey]: xValue });
          }
          
          groupedMap.get(xValue)[seriesValue] = yValue;
        });

        const groupedData = Array.from(groupedMap.values());
        
        // Sort grouped data by x-axis field to maintain chronological order
        groupedData.sort((a, b) => {
          const aValue = a[xKey];
          const bValue = b[xKey];
          
          if (typeof aValue === 'number' && typeof bValue === 'number') {
            return aValue - bValue;
          }
          
          if (typeof aValue === 'string' && typeof bValue === 'string') {
            const aDate = new Date(aValue);
            const bDate = new Date(bValue);
            
            if (isNaN(aDate.getTime()) || isNaN(bDate.getTime())) {
              return aValue.localeCompare(bValue);
            }
            
            return aDate.getTime() - bDate.getTime();
          }
          
          return String(aValue).localeCompare(String(bValue));
        });
        
        return {
          type: 'groupedBar',
          data: cleanedData,
          groupedData,
          title: `${yKey} by ${xKey} and ${seriesKey}`,
          xKey,
          yKey,
          seriesKey,
          isCurrency: isCurrencyField(yKey),
        };
      } else {
        // Simple date + numeric = line chart (for trends over time)
        chartType = 'line';
      }
    }
    // PRIORITY 2: Category breakdown for small datasets (pie chart)
    else if (categoryColumns.length > 0 && salesColumns.length > 0 && data.length <= 8) {
      chartType = 'pie';
      return {
        type: 'pie',
        data: data.map(row => ({
          name: String(row[categoryColumns[0]]),
          value: parseFloat(String(row[salesColumns[0]]).replace(/[$,\s%]/g, '')) || 0,
        })),
        title: `${categoryColumns[0]} by ${salesColumns[0]}`,
        nameKey: 'name',
        valueKey: 'value',
        isCurrency: isCurrencyField(salesColumns[0]),
      };
    }
    // PRIORITY 3: Category comparison (bar chart)
    else if (categoryColumns.length > 0 && numericKeys.length > 0) {
      chartType = 'bar';
      xKey = categoryColumns[0];
      yKey = salesColumns.length > 0 ? salesColumns[0] : numericKeys[0];
    }
    // FALLBACK: Any remaining numeric data (use first non-numeric field for x-axis)
    else if (numericKeys.length > 0) {
      chartType = 'bar';
      xKey = keys.find(k => !numericKeys.includes(k)) || keys[0];
      yKey = salesColumns.length > 0 ? salesColumns[0] : numericKeys[0];
    }

    if (!yKey) return null;

    // Clean and process data
    const processedData = data.map(row => {
      const cleanedRow = { ...row };
      
      // Clean numeric values
      if (cleanedRow[yKey] !== null && cleanedRow[yKey] !== undefined) {
        const rawValue = String(cleanedRow[yKey]);
        cleanedRow[yKey] = parseFloat(rawValue.replace(/[$,\s%]/g, '')) || 0;
      }
      
      return cleanedRow;
    }).filter(row => row[xKey] !== null && row[xKey] !== undefined);

    // Sort data by x-axis when it's a date/time field for proper chronological order
    if (dateKeys.includes(xKey)) {
      processedData.sort((a, b) => {
        const aValue = a[xKey];
        const bValue = b[xKey];
        
        // Handle different date formats
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          // Year numbers
          return aValue - bValue;
        }
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          // Date strings - convert to Date objects for comparison
          const aDate = new Date(aValue);
          const bDate = new Date(bValue);
          
          // If Date parsing fails, fall back to string comparison
          if (isNaN(aDate.getTime()) || isNaN(bDate.getTime())) {
            return aValue.localeCompare(bValue);
          }
          
          return aDate.getTime() - bDate.getTime();
        }
        
        // Mixed types or other cases - convert to string and compare
        return String(aValue).localeCompare(String(bValue));
      });
    }

    return {
      type: chartType,
      data: processedData,
      title: `${xKey} vs ${yKey}`,
      xKey,
      yKey,
      isCurrency: isCurrencyField(yKey),
    };
  };

  const renderChart = (chartConfig: ChartData) => {
    const { type, data, xKey, yKey, nameKey, valueKey, seriesKey, groupedData } = chartConfig;

    switch (type) {
      case 'line':
        if (!yKey) return null;
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} />
              <YAxis 
                tickFormatter={(value) => formatNumber(value, yKey, true)}
              />
              <Tooltip 
                formatter={(value) => [
                  typeof value === 'number' ? formatNumber(value, yKey, false) : value,
                  yKey
                ]}
                labelFormatter={(label) => `${xKey}: ${label}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey={yKey} 
                stroke="#007bff" 
                strokeWidth={2}
                dot={{ fill: '#007bff', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        if (!yKey) return null;
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} />
              <YAxis 
                tickFormatter={(value) => formatNumber(value, yKey, true)}
              />
              <Tooltip 
                formatter={(value) => [
                  typeof value === 'number' ? formatNumber(value, yKey, false) : value,
                  yKey
                ]}
                labelFormatter={(label) => `${xKey}: ${label}`}
              />
              <Legend />
              <Bar dataKey={yKey} fill="#007bff" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'groupedBar':
        if (!groupedData || !seriesKey) return null;
        
        // Get all unique series values for creating bars
        const seriesValues = Array.from(
          new Set(data.map(row => String(row[seriesKey])))
        ).sort();
        
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={groupedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} />
              <YAxis 
                tickFormatter={(value) => formatNumber(value, yKey || '', true)}
              />
              <Tooltip 
                formatter={(value, name) => [
                  typeof value === 'number' ? formatNumber(value, String(name), false) : value,
                  name
                ]}
                labelFormatter={(label) => `${xKey}: ${label}`}
              />
              <Legend />
              {seriesValues.map((series, index) => (
                <Bar 
                  key={series}
                  dataKey={series} 
                  fill={COLORS[index % COLORS.length]}
                  name={series}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        if (!valueKey || !nameKey) return null;
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey={valueKey}
                nameKey={nameKey}
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  // Extract Vega-Lite specifications ONLY from generate-pulse-metric-value-insight-bundle tool results
  const vegaSpecs = extractVegaLiteSpecs(toolResults);
  // DO NOT extract from response content - it may contain LLM-generated fake charts
  // const contentVegaSpecs = responseContent ? extractVegaLiteFromContent(responseContent) : [];
  let allVegaSpecs = [...vegaSpecs];
  
  // ONLY use real Vega-Lite specs from successful Pulse tool calls
  
  // Extract and analyze all tabular data from tool results and response content
  const charts: ChartData[] = [];
  
  // Check tool results for structured data - SKIP Pulse tools since they have their own Vega-Lite visualizations
  toolResults.forEach((result) => {
    // Skip Pulse tool results - they should only show Vega-Lite visualizations
    if (result.tool && result.tool.includes('pulse')) {
      return;
    }
    
    if (result.result) {
      const tableData = parseTableData(result.result);
      if (tableData && tableData.length > 1) {
        const chartConfig = detectChartType(tableData);
        if (chartConfig) {
          chartConfig.title = `${chartConfig.title}`;
          charts.push(chartConfig);
        }
      }
    }
  });
  
  // Also check response content for markdown tables
  if (responseContent && charts.length === 0) {
    const markdownTableData = parseMarkdownTable(responseContent);
    if (markdownTableData && markdownTableData.length > 1) {
      const chartConfig = detectChartType(markdownTableData);
      if (chartConfig) {
        chartConfig.title = `Sales Data: ${chartConfig.title}`;
        charts.push(chartConfig);
      }
    }
  }

  // If no visualizations found, return null
  if (charts.length === 0 && allVegaSpecs.length === 0) {
    return null;
  }

  return (
    <div>
      
      {/* Render Vega-Lite charts from Pulse tools */}
      {allVegaSpecs.map((vegaChart, index) => (
        <div key={`vega-${index}`} style={{ 
          marginBottom: allVegaSpecs.length > 1 || charts.length > 0 ? '20px' : '0px',
          padding: '0px'
        }}>
          <div style={{ width: '100%', height: '300px' }}>
            <VegaLite 
              spec={vegaChart.spec} 
              actions={false}
              renderer="svg"
              style={{ width: '100%', height: '100%' }}
              onError={(error) => {
                console.error('Vega-Lite rendering error:', error);
              }}
            />
          </div>
        </div>
      ))}
      
      {/* Render regular Recharts */}
      {charts.map((chart, index) => (
        <div key={`chart-${index}`} style={{ 
          marginBottom: '20px',
          padding: '16px',
          background: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ 
            fontSize: '13px', 
            fontWeight: '500', 
            marginBottom: '12px',
            color: '#495057'
          }}>
            📈 {chart.title}
          </div>
          {renderChart(chart)}
        </div>
      ))}
    </div>
  );
}

export default AIAssistentDataVisuzliation; 