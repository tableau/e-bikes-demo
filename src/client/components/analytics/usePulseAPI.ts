import { useAppContext } from '../../App';
import { getJwtFromServer } from './jwt';

export interface MetricDefinition {
  metric_id: string,
  definition_id: string,
  name: string,
  metric_specification: string,
  definition_specification: string,
  extension_options: string,
  representation_options: String,
  insights_options: string,
}

export function usePulseApi() {

  const { user } = useAppContext();

  const baseUrl = 'http://localhost:5001';
  const server = 'https://10ay.online.tableau.com';
  const site = 'ehofman';
  const subscriber = '8988c285-bb3a-47cd-b570-168a830abc04'; //'embedded@ebikes.com';

  /** returns the list of metric_ids the subscriber has a subscription to */
  async function getSubscribedMetrics(): Promise<{
    metric_id: string
  }[]> {

    if (!user) {
      return [];
    }

    const jwt = await getJwtFromServer(user);

    const query = encodeURIComponent(`user_id=${subscriber}`);
    const url = `${baseUrl}/api/-/pulse/subscriptions?server=${server}&site=${site}&jwt=${jwt}&query=${query}`;
    const response = await fetch(url, {
      method: 'GET',
    });

    const json = await response.json();

    if (json.errors?.length) {

      console.error(json.errors);
      return [];

    } else {

      return json.subscriptions.map((s: { metric_id: string; }) => ({
        metric_id: s.metric_id,
      }));

    }

  }

  /** returns the list of definition_ids for an array of metric_ids */
  async function getDefinitions(metric_ids: string[]): Promise<{
    metric_id: string,
    metric_specification: string,
    definition_id: string,
  }[]> {

    if (!user) {
      return [];
    }

    const jwt = await getJwtFromServer(user);

    const query = encodeURIComponent(`enable_sorting=true&metric_ids=${metric_ids.join(',')}`);
    const url = `${baseUrl}/api/-/pulse/metrics:batchGet?server=${server}&site=${site}&query=${query}&jwt=${jwt}`;
    const response = await fetch(url, {
      method: 'GET',
    });

    const json = await response.json();

    if (json.errors?.length) {

      console.error(json.errors);
      return [];

    } else {

      return json.metrics.map((s: any) => ({
        metric_id: s.id,
        metric_specification: s.specification,
        definition_id: s.definition_id,
      }));

    }

  }

  /** returns the list of definitions the subscriber has a subscription to */
  async function getMetricDefinitionsForSubscriber(): Promise<MetricDefinition[]> {

    if (!user) {
      return [];
    }

    const jwt = await getJwtFromServer(user);

    const subscriptions = await getSubscribedMetrics();
    const definitions = await getDefinitions(subscriptions.map(subscription => subscription.metric_id));

    const query = encodeURIComponent(`definition_ids=${definitions.map(definition => definition.definition_id)}`);
    const url = `${baseUrl}/api/-/pulse/definitions:batchGet?server=${server}&site=${site}&jwt=${jwt}&query=${query}`;
    const response = await fetch(url, {
      method: 'GET',
    });

    const json = await response.json();

    if (json.errors?.length) {

      console.error(json.errors);
      return [];

    } else {

      return json.definitions.map((s: any) => {

        const definition = definitions.find(definition => definition.definition_id === s.metadata.id)!;

        return {
          metricId: s.id,
          definitionId: s.definition_id,
          name: s.metadata.name,
          metric_specification: definition.metric_specification,
          definition_specifiction: s.specification,
          extension_options: s.extension_options,
          representation_options: s.representation_options,
          insights_options: s.insights_options,
        }
      });

    }

  }

  async function ban(metricDefinition: MetricDefinition) {
    
  }

  return { getMetricDefinitionsForSubscriber };

}