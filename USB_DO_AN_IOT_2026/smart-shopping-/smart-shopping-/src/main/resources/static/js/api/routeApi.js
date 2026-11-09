// ======================================================
// ROUTE API
// Goi Backend tao lo trinh
// ======================================================

export async function generateRouteApi(
    routeRequest
) {

    const response =
        await fetch(
            "/api/generate-route",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify(
                    routeRequest
                )
            }
        );

    const result =
        await response.json();

    if (!response.ok) {

        throw new Error(
            result.message
            || "Khong the tao lo trinh."
        );
    }

    return result;
}