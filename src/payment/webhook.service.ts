import User from "../user/user.model";
import Product from "../product/product.model";
import IUser from "../types/user.schema";
import Transaction from "./transaction.model";
import Wallet from "../user/wallet.model";
import { startSession, Types } from "mongoose";
import { ChargeSuccessPayload } from "../types/webhook.schema";
import crypto from "crypto";

class WebhookService {

    static async validateWebhook(webhookSignature: string, payload: any) {
        const encryptedData = crypto
            .createHmac("SHA512", process.env.FINCRA_WEBHOOK_KEY)
            .update(JSON.stringify(payload))
            .digest("hex");
        const signatureFromWebhook = webhookSignature;

        return encryptedData === signatureFromWebhook;

    }

    static async handleSuccessfulProductPurchase(payload: ChargeSuccessPayload) {
        const session = await startSession();
        try {
            if (payload.data.status === "success") {
                const { customer_id, product_id } = payload.data.metadata;

                const product = await Product.findById(product_id).populate("owner").session(session);
                if (!product) throw new Error("Product not found");
                product.status = "sold";
                await product.save({ session });

                // Seller
                const sellerWallet = await Wallet.findById((product.owner as unknown as IUser).wallet).session(session);
                if (!sellerWallet) throw new Error("Wallet not found");
                sellerWallet.balance += payload.data.amountToSettle;
                await sellerWallet.save({ session });


                // Customer
                const customer = await User.findById(customer_id).session(session);
                if (!customer) throw new Error("Customer not found");

                if (customer.account_status === "dormant") {
                    customer.account_status = "active";

                    if (customer.referred_by) {
                        const referrer = await User.findById(customer.referred_by).session(session);
                        if (!referrer) throw new Error("Referrer not found");
                        referrer.rewards.balance += 500;
                        await referrer.save({ session });
                    }

                }
                await customer.save({ session });

                // Transaction
                const transaction = await Transaction.findById(payload.data.reference).session(session);
                if (!transaction) throw new Error("Transaction not found");
                transaction.status = "success";
                transaction.charge_ref = payload.data.chargeReference
                await transaction.save({ session });
            }
        } catch (error) {
            console.error(error);
            await session.abortTransaction();
            throw error;
        } finally {
            await session.endSession();
        }
    }

    static async handleProductSponsorPayment(payload: any) {
    }
}

export default WebhookService;