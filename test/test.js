'use strict';

var VirtualMerchant = require('../index.js').gateway;
var TestGatewayHelper = require('../index.js').testGatewayHelper;
var GatewayError = require('42-cent-base').GatewayError;
var CreditCard = require('42-cent-model').CreditCard;
var Prospect = require('42-cent-model').Prospect;
var assert = require('assert');

var prospect = new Prospect()
      .withBillingFirstName('bob')
      .withBillingLastName('leponge')
      .withBillingEmailAddress('bob@leponge.fr')
      .withBillingPhone('0660296818')
      .withBillingAddress1('42A 2T WTC')
      .withBillingAddress2('42A 2T WTC')
      .withBillingCity('New York')
      .withBillingState('New York')
      .withBillingPostalCode('3212')
      .withBillingCountry('US')
      .withShippingFirstName('George')
      .withShippingLastName('Bush')
      .withShippingAddress1('42A 2T WTC')
      .withShippingAddress2('what')
      .withShippingCity('New York')
      .withShippingState('New York')
      .withShippingPostalCode('3212')
      .withShippingCountry('US');

var creditCard = new CreditCard()
      .withCreditCardNumber('4111111111111111')
      .withExpirationMonth('12')
      .withExpirationYear('2017')
      .withCvv2('123');

var forbiddenCreditCard = new CreditCard()
      .withCreditCardNumber('5000300020003003')
      .withExpirationMonth('12')
      .withExpirationYear('2017')
      .withCvv2('123');

describe('Virtual merchant service', function () {

  var service;

  //to avoid duplicate transaction we change the amount
  function randomAmount() {
    return Math.ceil(Math.random() * 100);
  }

  beforeEach(function () {
    service = VirtualMerchant({
      MERCHANT_ID: '000078',
      USER_ID: 'webpage',
      SSL_PIN: 'ZKN0S1',
      testMode: true
    });
  });

  describe('submit transaction', function () {

    it('should submit transaction request', function (done) {
      service.submitTransaction({
        amount: randomAmount()
      }, creditCard, prospect).then(function (transaction) {
        assert(transaction.transactionId, 'transactionId should be defined');
        assert(transaction._original, 'original should be defined');
        done();
      }, function (err) {
        done(err);
      });
    });

    it('should reject the promise when using credit card 5000 3000 2000 3003', function (done) {
      service.submitTransaction({amount: randomAmount()}, forbiddenCreditCard, prospect).then(function () {
        throw new Error('should not get here');
      }, function (rejection) {
        assert.equal(rejection, 'usage of this card has been restricted due to its undocumented behavior');
        done();
      });
    });

    xit('should reject the promise when web service send an error code', function (done) {
      service.submitTransaction({amount: TestGatewayHelper.adjustAmount(randomAmount(), 'visa', 'DECLINED')}, creditCard, prospect).then(function () {
        throw new Error('should not get here');
      }, function (rejection) {
        assert.equal(rejection.message, 'The Credit Card Number supplied in the authorization request appears to be invalid.');
        assert(rejection._original, 'should have the original error from sdk/gateway');
        done();
      });
    });

  });

  describe('authorize transaction', function () {

    it('should authorize transaction request', function (done) {

      service.authorizeTransaction({amount: randomAmount()}, creditCard, prospect).then(function (transaction) {
        assert(transaction.transactionId, 'transactionId should be defined');
        assert(transaction._original, 'original should be defined');
        done();
      }, function (err) {
        done(err);
      });
    });

    xit('should reject the promise when web service send an error code', function (done) {
      service.authorizeTransaction({amount: randomAmount()}, creditCard, prospect).then(function () {
        throw new Error('should not get here');
      }, function (rejection) {
        assert.equal(rejection.message, 'The Credit Card Number supplied in the authorization request appears to be invalid.');
        assert(rejection._original, 'should have the original error from sdk/gateway');
        done();
      });
    });

  });

  xdescribe('settle a transaction', function () {

    it('should settle a transaction', function (done) {
      var txnId;
      service.submitTransaction({amount: randomAmount()}, creditCard, prospect).then(function (transaction) {
        txnId = transaction.transactionId;
        assert(transaction.transactionId, 'transactionId should be defined');
        assert(transaction._original, 'original should be defined');
      })
        .then(function () {
          return service.settleTransaction(txnId);
        })
        .then(function (res) {
          assert.equal(res.transactionId, txnId);
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

  });

  describe('get batch statistics', function () {

    var service;

    beforeEach(function () {
      service = VirtualMerchant({
        MERCHANT_ID: '000078',
        USER_ID: 'webpage',
        SSL_PIN: 'ZKN0S1',
        testMode: true
      });
    });

    it('should get batch statistics', function (done) {
      service.getSettledBatchList(new Date(Date.now() - 1000 * 3600 * 24 * 7))
        .then(function (result) {
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    xit('should reject the promise when web service returns an error', function (done) {
      service.getSettledBatchList(new Date(), new Date(Date.now() - 24 * 1000 * 3600)).then(function (result) {
        throw new Error('should not get here');
      }).catch(function (err) {
        assert.equal(err.message, 'Search dates must be formatted as MM/DD/YYYY, the end date must be greater than the start date and the range cannot be greater than 31 days.', 'it should have the gateway error message');
        assert(err._original, '_original should be defined');
        done();
      });

      xit('should reject the promise when web service send an error code', function (done) {
        service.submitTransaction({amount: TestGatewayHelper.adjustAmount(randomAmount(), 'visa', 'DECLINED')}, creditCard, prospect).then(function () {
          throw new Error('should not get here');
        }, function (rejection) {
          assert.equal(rejection.message, 'The Credit Card Number supplied in the authorization request appears to be invalid.');
          assert(rejection._original, 'should have the original error from sdk/gateway');
          done();
        });
      });

      it('should reject the promise when using credit card 5000 3000 2000 3003', function (done) {
        service.submitTransaction({amount: randomAmount()}, forbiddenCreditCard, prospect).then(function () {
          throw new Error('should not get here');
        }, function (rejection) {
          assert.equal(rejection, 'usage of this card has been restricted due to its undocumented behavior');
          done();
        });
      });
    });

  });

  describe('refund a transaction', function () {

    it('should refund a transaction', function (done) {

      service.getSettledBatchList(new Date(Date.now() - 1000 * 3600 * 24 * 7))
        .then(function (result) {
          return result.filter(function (val) {
            return val.ssl_trans_status === 'STL';
          });
        })
        .then(function (settled) {
          if (settled.length === 0) {
            done("no settled transaction, can't test refund");
          }
          return service.refundTransaction(settled[0].ssl_txn_id, prospect);
        })
        .then(function (result) {
          assert.equal(result._original.ssl_result_message, 'APPROVAL');
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it('should reject the promise when web service return an error', function (done) {
      service.refundTransaction('-666')
        .then(function () {
          throw new Error('should not get here');
        })
        .catch(function (err) {
          assert(err instanceof GatewayError, 'err should be an instance of GatewayError');
          assert.equal(err.message, 'The transaction ID is invalid for this transaction type');
          assert(err._original, 'original should be defined');
          done();
        });
    });

  });

  describe('void a transaction', function () {

    it('should void a transaction', function (done) {
      var transId;
      service.submitTransaction({amount: randomAmount()}, creditCard, prospect).then(function (transaction) {
        transId = transaction.transactionId;
        return service.voidTransaction(transId, prospect);
      })
        .then(function (result) {
          assert(result._original, '_original should be defined');
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    xit('should reject the promise when the gateway returns error', function (done) {
      service.voidTransaction(666, prospect)
        .then(function (res) {
          throw new Error('it should not get here');
        }, function (err) {
          assert(err instanceof GatewayError, 'err should be an instance of GatewayError');
          assert.equal(err.message, 'The transaction ID is invalid for this transaction type');
          assert(err._original, 'original should be defined');
          done();
        });
    });

  });

  xdescribe('create customer profile', function () {

    it('should create a customer profile', function (done) {

      service.createCustomerProfile(creditCard, prospect)
        .then(function (result) {
          assert(result.profileId, ' profileId Should be defined');
          assert(result._original, '_original should be defined');
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    xit('should reject the promise when the gateway return an error', function (done) {
      var billing = {
        customerFirstName: 'bob',
        customerLastName: 'leponge',
        email: 'bob@eponge.com'
      };

      service.createCustomerProfile(cc, billing)
        .then(function (result) {
          throw new Error('it should not get here');
        }, function (err) {
          assert(err._original, '_original should be defined');
          assert.equal(err.message, 'The Credit Card Number supplied in the authorization request appears to be invalid.');
          done();
        });
    });

  });

  xdescribe('charge customer profile', function () {

    it('should charge a existing customer', function (done) {
      var random = Math.floor(Math.random() * 1000);
      prospect.customerEmail = 'something@else.fr';
      service.createCustomerProfile(cc, prospect)
        .then(function (result) {
          var randomAmount = Math.floor(Math.random() * 300);
          assert(result.profileId, ' profileId Should be defined');
          assert(result._original, '_original should be defined');

          prospect.profileId = result.profileId;
          return service.chargeCustomer({amount: randomAmount}, prospect);
        })
        .then(function (res) {
          assert.equal(res.transactionId, res._original.ssl_txn_id);
          assert(res._original, '_original should be defined');
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    xit('should reject the promise when the gateway return an error', function (done) {
      return service.chargeCustomer({amount: 234}, {profileId: '1234'})
        .then(function () {
          throw new Error('should not get here');
        }, function (err) {
          assert(err._original, '_original should be defined');
          assert.equal(err.message, 'The token supplied in the authorization request appears to be invalid');
          done();
        }
      );
    });

  });

  describe('transaction response messages', function () {

    describe('with VISA credit card', function () {

      Object.keys(TestGatewayHelper.responses.visa).forEach(function (expectedResponse) {
        it('should submit transaction request and get ' + expectedResponse, function (done) {
          var expected = expectedResponse.replace(/_/g, ' ');
          service.submitTransaction({
            amount: TestGatewayHelper.adjustAmount(randomAmount(), 'visa', expectedResponse)
          }, creditCard, prospect).then(function (transaction) {
            assert(transaction.transactionId, 'transactionId should be defined');
            assert(transaction._original, 'original should be defined');
            assert((transaction._original.ssl_result_message === expected), 'should get ' + expected);
            done();
          }, function (transaction) {
            assert(transaction._original, 'original should be defined');
            assert((transaction._original.ssl_result_message === expected), 'should get ' + expected);
            done();
          });
        });
      });

    });

  });

});


