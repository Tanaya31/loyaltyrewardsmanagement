namespace loyalty.management;

using { managed } from '@sap/cds/common';

entity Customer {
    key customerID : UUID;
    name           : String(100);
    email          : String(150);
    totalPoints    : Integer;
    tier           : String(20);

    transactions   : Composition of many Transaction
                       on transactions.customerID = $self;

    redemptions    : Composition of many Redemption
                       on redemptions.customerID = $self;
}

entity Transaction {
    key txnID       : UUID;

    customerID     : Association to one Customer;

    channel        : String(20);
    amount         : Decimal(10,2);
    txnDate        : DateTime;
    pointsEarned   : Integer;
}

entity Redemption {
    key redeemID    : UUID;

    customerID     : Association to one Customer;

    pointsUsed     : Integer;
    redeemDate     : DateTime;
    remarks        : String(255);
}

entity RewardPolicy : managed {
    key policyID          : UUID;

    policyName            : String(100);
    baseRate              : Decimal(10,4);
    onlineMultiplier      : Decimal(10,2);
    silverThreshold       : Integer;
    goldThreshold         : Integer;
    isActive              : Boolean default true;
}