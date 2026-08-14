const cds = require("@sap/cds");

module.exports = cds.service.impl(function () {

    const {
        Customer,
        Transaction,
        Redemption,
        RewardPolicy
    } = cds.entities("loyalty.management");


    this.on("recordPurchase", async (req) => {

        const db = cds.tx(req);
        const { customerID, channel, amount } = req.data;

        const customer = await db.run(
            SELECT.one.from(Customer).where({ customerID })
        );

        if (!customer)
            return req.error(404, "Customer not found");

        if (!["Online", "Store"].includes(channel))
            return req.error(400, "Channel must be Online or Store");

        if (!amount || Number(amount) <= 0)
            return req.error(400, "Purchase amount must be greater than zero");

        const policy = await db.run(
            SELECT.one.from(RewardPolicy).where({ isActive: true })
        );

        if (!policy)
            return req.error(400, "No active reward policy found");

        let points =
            Number(amount) * Number(policy.baseRate);

        if (channel === "Online")
            points *= Number(policy.onlineMultiplier);

        points = Math.floor(points);

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

        const total =
            Number(customer.totalPoints || 0) + points;

        const tier =
            total >= Number(policy.goldThreshold)
                ? "GOLD"
                : total >= Number(policy.silverThreshold)
                    ? "SILVER"
                    : "BRONZE";

        await db.run(
            UPDATE(Customer)
                .set({
                    totalPoints: total,
                    tier
                })
                .where({ customerID })
        );

        return transaction;
    });


    this.on("redeemPoints", async (req) => {

        const db = cds.tx(req);
        const { customerID, pointsUsed, remarks } = req.data;

        const customer = await db.run(
            SELECT.one.from(Customer).where({ customerID })
        );

        if (!customer)
            return req.error(404, "Customer not found");

        if (!pointsUsed || Number(pointsUsed) <= 0)
            return req.error(
                400,
                "Points used must be greater than zero"
            );

        const current =
            Number(customer.totalPoints || 0);

        if (Number(pointsUsed) > current)
            return req.error(
                400,
                `Insufficient loyalty points. Available points: ${current}`
            );

        const total =
            current - Number(pointsUsed);

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
                .set({
                    totalPoints: total,
                    tier
                })
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

        return redemption;
    });

});