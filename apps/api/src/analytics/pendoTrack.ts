/** Server-side Pendo Track Events sent to the Pendo track endpoint. */

export type TrackPropertyValue = string | number | boolean;

const trackEndpoint =
  process.env.PENDO_TRACK_ENDPOINT ?? "https://data.pendo-dev.pendo-dev.com/data/track";
// The track event secret is read from the environment and never committed.
const trackKey = process.env.PENDO_TRACK_KEY;

/**
 * Sends a Track Event to Pendo without blocking the request. Tracking failures are
 * logged and never affect the response.
 */
export function trackServerEvent(
  eventName: string,
  visitorId: string,
  accountId: string,
  properties: Record<string, TrackPropertyValue>
): void {
  if (!trackKey) return;
  const body = {
    type: "track",
    event: eventName,
    visitorId,
    accountId,
    timestamp: Date.now(),
    properties,
  };
  try {
    void fetch(trackEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-pendo-integration-key": trackKey },
      body: JSON.stringify(body),
    })
      .then((response) => {
        if (!response.ok) {
          console.error(`Pendo track event ${eventName} failed with ${response.status}`);
        }
      })
      .catch((error: unknown) => {
        console.error(`Pendo track event ${eventName} failed`, error);
      });
  } catch (error) {
    console.error(`Pendo track event ${eventName} failed`, error);
  }
}
