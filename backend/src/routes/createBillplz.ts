import axios from "axios";
import express from "express";

const router = express.Router();

router.post("/create-billplz", async (req, res) => {
  const { orderId, amount, name, email } = req.body;

  const billplzRes = await axios.post(
    "https://www.billplz.com/api/v3/bills",
    {
      collection_id: process.env.BILLPLZ_COLLECTION_ID,
      email,
      name,
      amount: amount * 100, // RM → sen
      callback_url: process.env.BILLPLZ_CALLBACK_URL,
      redirect_url: `${process.env.APP_URL}/payment-success?order=${orderId}`,
      description: `Order ${orderId}`,
    },
    {
      auth: {
        username: process.env.BILLPLZ_API_KEY!,
        password: "",
      },
    }
  );

  const bill = billplzRes.data;

  res.json({
    bill_id: bill.id,
    url: bill.url,
  });
});

export default router;
