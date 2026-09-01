using { loyalty.management as db } from '../db/schema';

@path: '/loyaltyrewards'
service LoyaltyService {

    @restrict: [
        { grant: 'READ', to: ['Customer', 'RetailStaff', 'Admin'] },
        { grant: ['CREATE', 'UPDATE', 'DELETE'], to: 'Admin' }
    ]
    entity Customers as projection on db.Customer;

    @restrict: [
        { grant: 'READ', to: ['Customer', 'RetailStaff', 'Admin'] }
    ]
    entity Transactions as projection on db.Transaction;

    @restrict: [
        { grant: 'READ', to: ['Customer', 'Admin'] }
    ]
    entity Redemptions as projection on db.Redemption;

    @restrict: [
        { grant: ['READ', 'CREATE', 'UPDATE', 'DELETE'], to: 'Admin' }
    ]
    entity RewardPolicies as projection on db.RewardPolicy;

    @requires: 'RetailStaff'
    action recordPurchase(
        customerID : UUID,
        channel    : String(20),
        amount     : Decimal(10,2)
    ) returns Transactions;

    @requires: 'Customer'
    action redeemPoints(
        customerID : UUID,
        pointsUsed : Integer,
        remarks    : String(255)
    ) returns Redemptions;
}