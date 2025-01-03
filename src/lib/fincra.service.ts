import axios, { AxiosRequestConfig } from "axios";
import { Fincra } from "fincra-node-sdk";
import type IUser from "../types/user.schema";
import type IProduct from "../types/product.schema";
import type { SponsorshipDuration } from "../types/product.schema";
import { decryptBvn } from "./main";
import { AdPayments } from "../types/ad.enums";
import { cfg } from "../init";

class FincraService {

    private static FINCRA_BASE_URL = "https://sandboxapi.fincra.com";
    private static fincra = new Fincra(
        cfg.FINCRA_PUBLIC_KEY,
        cfg.FINCRA_SECRET_KEY,
        { sandbox: cfg.NODE_ENV === "production" ? false : true }
    );

    private static async getBusinessInfo() {
        try {
            const url = `${this.FINCRA_BASE_URL}/profile/business/me`;
            const headers = {
                "api-key": cfg.FINCRA_SECRET_KEY,
                "Accept": "application/json",
                "Content-Type": "application/json"

            }
            // get request; ._id is business id
            const res = await axios.get(url, { headers });
            console.log({ business: res.data });

            return res.data;

        } catch (error) {
            console.error((error as Error).stack);
            throw error;
        }
    }

    static async resolveBvn(bvn: string, business: string) {
        try {
            const url = `${this.FINCRA_BASE_URL}/core/bvn-verification`;
            const headers = {
                "Content-Type": "application/json",
                "Accepts": "application/json",
                "api-key": cfg.FINCRA_SECRET_KEY
            }
            const res = await axios.post(url, {
                bvn,
                business
            }, { headers });
            return res.data
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
    /*
     * @deprecated 
     */
    static async createVirtualWallet(user: IUser) {
        try {
            const opts: AxiosRequestConfig = {
                url: `${FincraService.FINCRA_BASE_URL}/profile/virtual-accounts/requests`,
                method: "POST",
                headers: {
                    "api-key": cfg.FINCRA_SECRET_KEY,
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                data: {
                    "currency": "NGN",
                    "accountType": "individual",
                    merchantReference: user.id,
                    "KYCInformation": {
                        "firstName": user.first_name,
                        "lastName": user.last_name,
                        "email": user.email,
                        "bvn": decryptBvn(user.bvn?.encrypted_data as string),
                    },
                    "channel": "wema"
                }

            }
            const res = await axios.request(opts);
            return res.data;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    static async purchaseItem(product: IProduct, customer: IUser, ref: string, paymentMethod: string, bidPrice?: number) {
        try {
            const opts: AxiosRequestConfig = {
                url: `${FincraService.FINCRA_BASE_URL}/checkout/payments`,
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "api-key": cfg.FINCRA_SECRET_KEY,
                    "x-pub-key": cfg.FINCRA_PUBLIC_KEY,
                },
                data: {
                    amount: bidPrice ? bidPrice : product.price,
                    currency: "NGN",
                    customer: {
                        name: `${customer.first_name} ${customer.last_name}`,
                        email: customer.email,
                        phoneNumber: customer.phone_numbers[0]
                    },
                    metadata: {
                        customer_id: customer.id,
                        product_id: product.id,
                        payment_for: "product_payment",
                        amount_expected: bidPrice ? bidPrice : product.price,
                    },
                    successMessage: "You have successfully intiated transfer",
                    paymentMethods: [paymentMethod],
                    settlementDestination: "wallet",
                    feeBearer: "customer",
                    reference: ref
                }
            }
            const res = await axios.request(opts);
            return res.data;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    /**
    * DOES THE SAME WORK AS WEBHOOKS JUST ACTS AS A FAILSAFE INCASE WEBHOOKS ARENT RECEIVED
    **/
    static async verifyPaymentStatus(ref: string) {
        try {
            const verifyPaymentEndpoint = `${FincraService.FINCRA_BASE_URL}/checkout/payments/merchant-reference/${ref}`;

            const res = await axios.get(verifyPaymentEndpoint, {
                headers: {
                    "Accept": "application/json",
                    "x-business-id": cfg.FINCRA_BUSINESS_ID
                }
            });
            return res.data;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    static async withdrawFunds(user: IUser, ref: string, amount: number) {
        const OYEAH_CUT = (5 / 100) * amount;
        const PROCESSING_FEE = 200
        const AMOUNT_TO_WITHDRAW = amount - OYEAH_CUT - PROCESSING_FEE;
        try {
            const payoutUrl = `${FincraService.FINCRA_BASE_URL}/disbursements/payouts`;
            const headers = {
                "api-key": cfg.FINCRA_SECRET_KEY,
                "Content-Type": "application/json",
                "Accepts": "application/json"
            }
            const res = await axios.post(payoutUrl, {
                business: cfg.FINCRA_BUSINESS_ID,
                sourceCurrency: "NGN",
                destinationCurrency: "NGN",
                amount: `${AMOUNT_TO_WITHDRAW}`,
                description: "Payment",
                customerReference: ref,
                beneficiary: {
                    firstName: user.first_name,
                    lastName: user.last_name,
                    email: user.email,
                    type: "individual",
                    accountHolderName: `${user.first_name} ${user.last_name}`,
                    accountNumber: `${user.bank_details.account_no}`,
                    country: "NG",
                    bankCode: `${user.bank_details.bank_code}`,
                },
                sender: {
                    name: "Customer Name",
                    email: "customer@theirmail.com",
                },
                paymentDestination: "bank_account",
            }, { headers });

            return res.data;
        } catch (error) {
            throw error;
        }
    }

    static async withdrawRewards(user: IUser, amount: number, ref: string) {
        try {
            const payoutUrl = `${FincraService.FINCRA_BASE_URL}/disbursements/payouts`;
            const headers = {
                "api-key": cfg.FINCRA_SECRET_KEY,
                "Content-Type": "application/json",
                "Accepts": "application/json"
            }
            const res = await axios.post(payoutUrl, {
                business: cfg.FINCRA_BUSINESS_ID,
                sourceCurrency: "NGN",
                destinationCurrency: "NGN",
                amount: `${amount}`,
                description: "Payment",
                customerReference: ref,
                beneficiary: {
                    firstName: user.first_name,
                    lastName: user.last_name,
                    email: user.email,
                    type: "individual",
                    accountHolderName: `${user.first_name} ${user.last_name}`,
                    accountNumber: user.bank_details.account_no.toString(),
                    country: "NG",
                    bankCode: user.bank_details.bank_code.toString(),
                },
                sender: {
                    name: "Oyeah Escrow",
                    email: "payments@oyeahescrow.com",
                },
                paymentDestination: "bank_account",
            }, { headers });

            return res.data;
        } catch (error) {
            throw error;
        }
    }

    static async sponsorProduct(product: IProduct, owner: IUser, sponsorshipDuration: SponsorshipDuration, ref: string, paymentMethod: string) {
        try {
            const opts: AxiosRequestConfig = {
                url: `${FincraService.FINCRA_BASE_URL}/checkout/payments`,
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "api-key": cfg.FINCRA_SECRET_KEY,
                    "x-pub-key": cfg.FINCRA_PUBLIC_KEY,
                },
                data: {
                    "amount": sponsorshipDuration == "1Week" ? AdPayments.weekly : AdPayments.monthly,
                    "currency": "NGN",
                    "customer": {
                        "name": `${owner.first_name} ${owner.last_name}`,
                        "email": owner.email,
                        "phoneNumber": owner.phone_numbers[0]
                    },
                    metadata: {
                        "customer_id": owner.id,
                        "product_id": product.id,
                        "payment_for": "ad_sponsorship",
                        amount_expected: sponsorshipDuration == "1Week" ? AdPayments.weekly : AdPayments.monthly
                    },
                    "successMessage": "You have successfully intiated transfer",
                    "paymentMethods": [paymentMethod],
                    "settlementDestination": "wallet",
                    "feeBearer": "customer",
                    "reference": ref
                }
            }
            const res = await axios.request(opts);
            return res.data;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    static async handleRefund(user: IUser, amount: number, ref: string) {
        try {
            const payoutUrl = `${FincraService.FINCRA_BASE_URL}/disbursements/payouts`;
            const headers = {
                "api-key": cfg.FINCRA_SECRET_KEY,
                "Content-Type": "application/json",
                "Accepts": "application/json"
            };

            const refundData = {
                business: cfg.FINCRA_BUSINESS_ID,
                sourceCurrency: "NGN",
                destinationCurrency: "NGN",
                amount: `${amount}`,
                description: "Refund",
                customerReference: ref,
                beneficiary: {
                    firstName: user.first_name,
                    lastName: user.last_name,
                    email: user.email,
                    type: "individual",
                    accountHolderName: `${user.first_name} ${user.last_name}`,
                    accountNumber: `${user.bank_details.account_no}`,
                    country: "NG",
                    bankCode: `${user.bank_details.bank_code}`,
                },
                sender: {
                    name: "Oyeah Escrow",
                    email: "refunds@oyeahescrow.com.ng",
                },
                paymentDestination: "bank_account",
            };
            const res = await fetch(payoutUrl, {
                method: 'POST',
                mode: 'cors',
                headers,
                body: JSON.stringify(refundData)
            });
            const result = await res.json();
            return result;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}

export default FincraService;
