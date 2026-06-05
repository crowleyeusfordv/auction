export default function mapQueryParameters(baseEndpoint: string, queryParameters?: Record<string, string>) {
    const queryParams = new URLSearchParams(queryParameters).toString();
    const finalEndpoint = queryParams ? `${baseEndpoint}?${queryParams}` : baseEndpoint;
    return finalEndpoint
}