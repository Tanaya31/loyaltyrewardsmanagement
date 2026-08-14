using { loyalty.management as db } from '../db/schema';

@path: '/loyaltyrewards'
service LoyaltyService {

    entity Customers as projection on db.Customer;

    entity Transactions as projection on db.Transaction;

    entity Redemptions as projection on db.Redemption;

    entity RewardPolicies as projection on db.RewardPolicy;

    action recordPurchase(
        customerID : UUID,
        channel    : String(20),
        amount     : Decimal(10,2)
    ) returns Transactions;

    action redeemPoints(
        customerID : UUID,
        pointsUsed : Integer,
        remarks    : String(255)
    ) returns Redemptions;
}