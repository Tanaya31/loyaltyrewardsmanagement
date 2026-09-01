const cds = require("@sap/cds");

module.exports = cds.service.impl(function () {
    const LOG = cds.log("loyalty");
    const {Customer,Transaction,Redemption,RewardPolicy} =
        cds.entities("loyalty.management");

    this.on("recordPurchase", async (req) => {
        const db = cds.tx(req);
        const { customerID, channel, amount } = req.data;

        LOG.info("recordPurchase started", { customerID, channel, amount });

        const customer = await db.run(
            SELECT.one.from(Customer).where({ customerID })
        );

        if (!customer) {
            LOG.error("Customer not found", { customerID });
            return req.error(404, "Customer not found");
        }

        if (!["Online", "Store"].includes(channel)) {
            LOG.error("Invalid channel", { channel });
            return req.error(400, "Channel must be Online or Store");
        }

        if (!amount || Number(amount) <= 0) {
            LOG.error("Invalid amount", { amount });
            return req.error(400, "Purchase amount must be greater than zero");
        }

        const policy = await db.run(
            SELECT.one.from(RewardPolicy).where({ isActive: true })
        );

        if (!policy) {
            LOG.error("No active reward policy found");
            return req.error(400, "No active reward policy found");
        }

        let points = Number(amount) * Number(policy.baseRate);

        if (channel === "Online")
            points *= Number(policy.onlineMultiplier);

        points = Math.floor(points);

        LOG.info("Points calculated", { customerID, points });

        const transaction = {
            txnID: cds.utils.uuid(),
            customerID_customerID: customerID,
            channel,
            amount,
            txnDate: new Date().toISOString(),
            pointsEarned: points
        };

        await db.run(
            INSERT.into(Transaction).entries(transaction)
        );

        const total = Number(customer.totalPoints || 0) + points;

        const tier =
            total >= Number(policy.goldThreshold)
                ? "GOLD"
                : total >= Number(policy.silverThreshold)
                    ? "SILVER"
                    : "BRONZE";

        await db.run(
            UPDATE(Customer)
                .set({ totalPoints: total, tier })
                .where({ customerID })
        );

        LOG.info("Purchase completed", { customerID, points, total, tier });

        return transaction;
    });

    this.on("redeemPoints", async (req) => {
        const db = cds.tx(req);
        const { customerID, pointsUsed, remarks } = req.data;

        LOG.info("redeemPoints started", { customerID, pointsUsed });

        const customer = await db.run(
            SELECT.one.from(Customer).where({ customerID })
        );

        if (!customer) {
            LOG.error("Customer not found", { customerID });
            return req.error(404, "Customer not found");
        }

        if (!pointsUsed || Number(pointsUsed) <= 0) {
            LOG.error("Invalid points used", { pointsUsed });
            return req.error(
                400,
                "Points used must be greater than zero"
            );
        }

        const current = Number(customer.totalPoints || 0);

        if (Number(pointsUsed) > current) {
            LOG.error("Insufficient loyalty points", {
                customerID, available: current, requested: pointsUsed
            });
            return req.error(
                400,
                `Insufficient loyalty points. Available points: ${current}`
            );
        }

        const total = current - Number(pointsUsed);

        const policy = await db.run(
            SELECT.one.from(RewardPolicy)
                .where({ isActive: true })
        );

        const tier = policy
            ? total >= Number(policy.goldThreshold)
                ? "GOLD"
                : total >= Number(policy.silverThreshold)
                    ? "SILVER"
                    : "BRONZE"
            : "BRONZE";

        await db.run(
            UPDATE(Customer)
                .set({ totalPoints: total, tier })
                .where({ customerID })
        );

        const redemption = {
            redeemID: cds.utils.uuid(),
            customerID_customerID: customerID,
            pointsUsed,
            redeemDate: new Date().toISOString(),
            remarks
        };

        await db.run(
            INSERT.into(Redemption).entries(redemption)
        );

        LOG.info("Redemption completed", {
            customerID, pointsUsed, remainingPoints: total, tier
        });

        return redemption;
    });
});