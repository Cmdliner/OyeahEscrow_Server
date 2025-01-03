import { v4 as uuidV4 } from "uuid";
import User from "../user/user.model";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";

class AuthService {

    static async generateUniqueReferralCode(): Promise<string | null> {
        for (let limit = 0; limit < 5; limit++) {
            const referralCode = uuidV4().split("-")[0];
            let duplicateCodeFound = !!await User.exists({ referral_code: referralCode });
            if (!duplicateCodeFound) return referralCode;
        }
        return null;
    }

    static async createToken(payload: Types.ObjectId, secret: string, expiry: string | number): Promise<string> {
        return jwt.sign({ id: payload }, secret, { expiresIn: expiry });
    }
}

export default AuthService;