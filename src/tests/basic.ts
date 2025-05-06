import { expect } from 'chai';
import {Given, Then, When} from "cucumber";


Given(/^a passing test and a set of step definitions$/, function () {
    this.testExists = true
});

When(/^I run the test$/, function () {
    this.testRun = true
});
Then(/^the test passes$/, function () {
    expect(this.testExists).to.be.true
    expect(this.testRun).to.be.true
});
