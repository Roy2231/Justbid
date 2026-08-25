import { DodoPayments } from "dodopayments";

async function run() {
  try {
    const dodo = new DodoPayments({ bearerToken: process.env.DODO_PAYMENTS_API_KEY });
    const productId = process.env.DODO_PRODUCT_ID;
    
    if (!productId) {
      console.log("No product id");
      return;
    }

    console.log("Creating payment...");
    const session = await dodo.payments.create({
        billing: { city: "San Francisco", country: "US", state: "CA", street: "123 Market St", zipcode: "94105" },
        customer: { name: "Winner", email: "winner@justbid.app" },
        product_cart: [
          {
            product_id: productId,
            quantity: 1,
            amount: 100 * 100 // $100
          }
        ],
        payment_link: true,
        return_url: `http://localhost:3000/dashboard?payment_success=true`
    });
    console.log("SESSION:", JSON.stringify(session, null, 2));
  } catch (err: any) {
    console.error("ERROR:", err?.message || err);
  }
}
run();
