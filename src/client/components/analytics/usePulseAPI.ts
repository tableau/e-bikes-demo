import { useAuth } from "../auth/useAuth";
import { server, site, subscriber } from "../../constants/Constants";

interface MetricDefinition {
  metric_id: string,
  definition_id: string,
  name: string,
  url: string,
  metric_specification: string,
  definition_specification: string,
  extension_options: string,
  representation_options: string,
  insights_options: string,
}

export interface BanInsight {
  metricDefinition: MetricDefinition;
  period: string;
  markup: string;
  value: number;
  direction: 'up' | 'down';
  sentiment: 'negative' | 'positive';
}

export function usePulseApi() {

  const { getJwtFromServer } = useAuth()

  async function getHeaders() {

    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      jwt: await getJwtFromServer(),
      server: server,
      site: site,
    } as HeadersInit;

  }

  /** returns the list of metric_ids the subscriber has a subscription to */
  async function getSubscribedMetrics(): Promise<{
    metric_id: string
  }[]> {

    const query = encodeURIComponent(`user_id=${subscriber}`);
    const url = `/api/-/pulse/subscriptions?query=${query}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: await getHeaders(),
    });

    const json = await response.json();

    if (json.errors?.length) {

      console.error(json.errors);
      return [];

    } else {

      return json.subscriptions.map((subscription_response: { metric_id: string; }) => ({
        metric_id: subscription_response.metric_id,
      }));

    }

  }

  /** returns the list of definition_ids for an array of metric_ids */
  async function getDefinitions(metric_ids: string[]): Promise<{
    metric_id: string,
    metric_specification: string,
    definition_id: string,
  }[]> {

    const query = encodeURIComponent(`enable_sorting=true&metric_ids=${metric_ids.join(',')}`);
    const url = `/api/-/pulse/metrics:batchGet?query=${query}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: await getHeaders(),
    });

    const json = await response.json();

    if (json.errors?.length) {

      console.error(json.errors);
      return [];

    } else {

      return json.metrics.map((metric_response: any) => ({
        metric_id: metric_response.id,
        metric_specification: metric_response.specification,
        definition_id: metric_response.definition_id,
      }));

    }

  }

  async function getPulseEnhancedQAInsights(question: string): Promise<string> {

    const metricDefinitions = await getSubscribedMetricDefinitions();
    const url = `/api/-/pulse/insights/brief`

    const response = await fetch(url, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({
        messages: [{
          role: "ROLE_USER",
          content: question,
          metric_group_context: metricDefinitions.map(metricDefinition => ({
            metadata: {
              name: metricDefinition.name,
              metric_id: metricDefinition.metric_id,
              definition_id: metricDefinition.definition_id,
            },
            metric: {
              definition: metricDefinition.definition_specification,
              metric_specification: metricDefinition.metric_specification,
              extension_options: metricDefinition.extension_options,
              representation_options: metricDefinition.representation_options,
              insights_options: metricDefinition.insights_options,
            }
          })),
          metric_group_context_resolved: false,
          action_type: "ACTION_TYPE_ANSWER",
        }],
        time_zone: "UTC"
      }),
    });

    const json = await response.json();
    return json.markup as string;

  }

  /** returns the list of definitions the subscriber has a subscription to */
  async function getSubscribedMetricDefinitions(): Promise<MetricDefinition[]> {

    const subscriptions = await getSubscribedMetrics();
    const definitions = await getDefinitions(subscriptions.map(subscription => subscription.metric_id));

    const query = encodeURIComponent(`definition_ids=${definitions.map(definition => definition.definition_id)}`);
    const url = `/api/-/pulse/definitions:batchGet?query=${query}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: await getHeaders(),
    });

    const json = await response.json();

    if (json.errors?.length) {

      console.error(json.errors);
      return [];

    } else {

      return json.definitions.map((definition_response: any) => {

        const definition = definitions.find(definition => definition.definition_id === definition_response.metadata.id)!;

        return {
          metric_id: definition.metric_id,
          definition_id: definition.definition_id,
          name: definition_response.metadata.name,
          url: `https://${server}/pulse/site/${site}/metrics/${definition.metric_id}`,
          metric_specification: definition.metric_specification,
          definition_specification: definition_response.specification,
          extension_options: definition_response.extension_options,
          representation_options: definition_response.representation_options,
          insights_options: definition_response.insights_options,
        } as MetricDefinition
      });

    }

  }

  async function getSubscribedBanInsights(): Promise<BanInsight[]> {

    const metricDefinitions = await getSubscribedMetricDefinitions();

    const promises = metricDefinitions.map(async (metricDefinition) => {

      const url = `/api/-/pulse/insights/ban`;
      const response = await fetch(url, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify({
          bundle_request: {
            version: '1',
            options: {
              output_format: 'OUTPUT_FORMAT_TEXT',
            },
            input: {
              metadata: {
                name: metricDefinition.name,
                metric_id: metricDefinition.metric_id,
                definition_id: metricDefinition.definition_id,
              },
              metric: {
                definition: metricDefinition.definition_specification,
                metric_specification: metricDefinition.metric_specification,
                extension_options: metricDefinition.extension_options,
                representation_options: metricDefinition.representation_options,
                insights_options: metricDefinition.insights_options,
              },
            }
          }
        })
      });

      const json = await response.json();
      const insight = json.bundle_response.result.insight_groups[0].insights[0].result

      return {
        metricDefinition,
        period: insight.facts.target_time_period.label,
        markup: insight.markup,
        value: insight.facts.target_period_value.formatted,
        direction: insight.facts.difference.direction,
        sentiment: insight.facts.sentiment,
      } as BanInsight;

    });

    return await Promise.all(promises);
  }

  async function getSubscribedSpringboardInsights(): Promise<BanInsight[]> {

    const metricDefinitions = await getSubscribedMetricDefinitions();

    const promises = metricDefinitions.map(async (metricDefinition) => {

      const url = `/api/-/pulse/insights/springboard`;
      const response = await fetch(url, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify({
          bundle_request: {
            version: '1',
            options: {
              output_format: 'OUTPUT_FORMAT_TEXT',
            },
            input: {
              metadata: {
                name: metricDefinition.name,
                metric_id: metricDefinition.metric_id,
                definition_id: metricDefinition.definition_id,
              },
              metric: {
                definition: metricDefinition.definition_specification,
                metric_specification: metricDefinition.metric_specification,
                extension_options: metricDefinition.extension_options,
                representation_options: metricDefinition.representation_options,
                insights_options: metricDefinition.insights_options,
              },
            }
          }
        })
      });

      const json = await response.json();
      const insightGroups = json.bundle_response.result.insight_groups;

      console.log('Pulse Springboard Insights Groups', insightGroups);
      // Default values in case specific fields aren't found in the response
      let markup = "";
      let period = "";
      let value = 0;
      let direction: 'up' | 'down' = 'up';
      let sentiment: 'positive' | 'negative' = 'positive';

      // Extract markup from insights of type "top"
      const topInsightGroup = insightGroups.find((group: any) => group.type === "top");
      if (topInsightGroup) {
        const topInsight = topInsightGroup.insights[0];
        if (topInsight?.result) {
          markup = topInsight.result.markup || "";
        }
      }

      // Extract sentiment, direction, period, and value from insights of type "ban"
      const banInsightGroup = insightGroups.find((group: any) => group.type === "ban");
      if (banInsightGroup) {
        const banInsight = banInsightGroup.insights[0];
        if (banInsight?.result) {
          period = banInsight.result.facts.target_time_period?.label || "";
          value = banInsight.result.facts.target_period_value?.formatted || 0;
          direction = banInsight.result.facts.difference?.direction || 'up';
          sentiment = banInsight.result.facts.sentiment || 'positive';
        }
      }

      return {
        metricDefinition,
        period,
        markup,
        value,
        direction,
        sentiment,
      } as BanInsight;

    });

    return await Promise.all(promises);
  }



  // return { getSubscribedBanInsights };
  return {
    getPulseEnhancedQAInsights,
    getSubscribedBanInsights,
    getSubscribedSpringboardInsights
  };


}