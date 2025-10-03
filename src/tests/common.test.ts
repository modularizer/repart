import { re, matchAndExtract } from '../repart';
import { 
  EMAIL_PATTERN, 
  MAILTO_PATTERN,
  PHONE_NUMBER_PATTERN,
  INT_PATTERN_US,
  INT_PATTERN_EU,
  INT_PATTERN_UNDERSCORE,
  FLOAT_PATTERN_US,
  FLOAT_PATTERN_EU,
  STATE_CODE_PATTERN,
  STATE_NAME_PATTERN,
  STATE_PATTERN,
  toInt,
  toFloat,
  isInt,
  isFloat,
  toPhoneNumber,
  isPhoneNumber,
  matchAnyState
} from '../repart/common';

describe('Common Patterns', () => {
  describe('EMAIL_PATTERN', () => {
    test('should match valid email addresses', () => {
      const testEmails = [
        'john@example.com',
        'jane.doe@company.org',
        'user+tag@domain.co.uk',
        'test123@subdomain.example.net'
      ];

      testEmails.forEach(email => {
        const result = matchAndExtract(email, EMAIL_PATTERN);
        expect(result).not.toBeNull();
        expect(result.email).toBe(email);
      });
    });

    test('should extract email components', () => {
      const result = matchAndExtract('john@gmail.com', EMAIL_PATTERN);
      
      expect(result.email).toBe('john@gmail.com');
      expect(result.emailHandle).toBe('john');
      expect(result.emailDomain).toBe('gmail.com');
      expect(result.emailTLD).toBe('com');
    });

    test('should handle complex email formats', () => {
      const result = matchAndExtract('user.name+tag@subdomain.example.co.uk', EMAIL_PATTERN);
      
      expect(result.email).toBe('user.name+tag@subdomain.example.co.uk');
      expect(result.emailHandle).toBe('user.name+tag');
      expect(result.emailDomain).toBe('subdomain.example.co.uk');
      expect(result.emailTLD).toBe('uk');
    });

    test('should handle edge case valid emails', () => {
      const edgeCaseEmails = [
        'a@b.co',                    // Minimal valid email
        'test@example.com',          // Standard format
        'user_name@domain-name.org', // Underscores and hyphens
        'user123@sub.domain.info',   // Numbers and subdomains
        'user@domain.co.uk',         // Multi-part TLD
        'test@domain.museum',        // Long TLD
        'user+tag@domain.com',       // Plus sign in local part
        'user.name@domain.com',      // Dot in local part
        'user-name@domain.com',      // Hyphen in local part
      ];

      edgeCaseEmails.forEach(email => {
        const result = matchAndExtract(email, EMAIL_PATTERN);
        expect(result).not.toBeNull();
        expect(result.email).toBe(email);
      });
    });

    test('should not match invalid emails', () => {
      const invalidEmails = [
        'notanemail',           // No @ symbol
        '@domain.com',          // No local part
        'user@',                // No domain
        'user@domain',          // No TLD
        'user..name@domain.com', // Double dots in local part
        '.user@domain.com',     // Starts with dot
        'user.@domain.com',     // Ends with dot
        'user@.domain.com',     // Domain starts with dot
        'user@domain..com',     // Double dots in domain
        'user@domain.com.',     // Domain ends with dot
        'user@domain.c',        // TLD too short
        'user name@domain.com', // Space in local part
        'user@domain name.com', // Space in domain
        'user@@domain.com',     // Double @
        'user@domain@com',      // Multiple @
        '',                     // Empty string
        'user@domain..com',     // Double dots in domain
        'user@domain.com.',     // Trailing dot
        'user@domain.c',        // Single character TLD
        'user@domain.123',      // Numeric TLD
        'user@domain.c-om',     // Hyphen in TLD
        'user@domain.co.uk.',   // Trailing dot after multi-part TLD
      ];

      invalidEmails.forEach(email => {
        const result = matchAndExtract(email, re`^${EMAIL_PATTERN}$`);
        if (result !== null){
          throw new Error(`matched "${email}" as ${JSON.stringify(result)}`)
        }
        expect(result).toBeNull();
      });
    });
  });

  describe('MAILTO_PATTERN', () => {
    test('should match mailto links', () => {
      const result = matchAndExtract('mailto:john@example.com', MAILTO_PATTERN);
      
      expect(result).not.toBeNull();
      expect(result.email).toBe('john@example.com');
      expect(result.emailHandle).toBe('john');
      expect(result.emailDomain).toBe('example.com');
      expect(result.emailTLD).toBe('com');
    });

    test('should work with complex email formats', () => {
      const result = matchAndExtract('mailto:jane.doe+work@company.org', MAILTO_PATTERN);
      
      expect(result.email).toBe('jane.doe+work@company.org');
      expect(result.emailHandle).toBe('jane.doe+work');
      expect(result.emailDomain).toBe('company.org');
      expect(result.emailTLD).toBe('org');
    });
  });

  describe('PHONE_NUMBER_PATTERN', () => {
    test('should match various phone number formats', () => {
      const testPhones = [
        '+1-555-123-4567',
        '(555) 123-4567',
        '555-123-4567',
        '555.123.4567',
        '+1 555 123 4567',
        '5551234567'
      ];

      testPhones.forEach(phone => {

        const result = PHONE_NUMBER_PATTERN.matchAndExtract(phone);
        expect(result).not.toBeNull();
      });
    });

    test('should extract phone components', () => {
      const result = matchAndExtract('+1-555-123-4567', PHONE_NUMBER_PATTERN).phone;
      
      expect(result.phone).toBe('+1-555-123-4567');
      expect(result.countryCode).toBe('1');
      expect(result.areaCode).toBe('555');
      expect(result.telephonePrefix).toBe('123');
      expect(result.lineNumber).toBe('4567');
    });

    test('should handle different country codes', () => {
      const result = PHONE_NUMBER_PATTERN.matchAndExtract('+44-20-7946-0958').phone;
      if (result === null){
        throw new Error(`failed to match +44-20-7946-0958`)
      }
      
      expect(result.phone).toBe('+44-20-7946-0958');
      expect(result.countryCode).toBe('44');
      expect(result.areaCode).toBe('20');
      expect(result.telephonePrefix).toBe('7946');
      expect(result.lineNumber).toBe('0958');
    });
  });

  describe('Number Patterns', () => {
    describe('INT_PATTERN_US', () => {
      test('should match US integer format', () => {
        const testNumbers = [
          '1,234',
          '12,345',
          '123,456',
          '1,234,567',
          '123'
        ];

        testNumbers.forEach(num => {
          const result = matchAndExtract(num, INT_PATTERN_US);
          expect(result).not.toBeNull();
          expect(result.int.raw).toBe(num);
          expect(result.int.value).toBe(parseInt(num.replace(/\D/g,'')));
        });
      });

      test('should extract integer value', () => {
        const result = matchAndExtract('1,234', INT_PATTERN_US);
        expect(result.int.raw).toBe('1,234');
        expect(result.int.value).toBe(1234);
      });
    });

    describe('INT_PATTERN_EU', () => {
      test('should match EU integer format', () => {
        const testNumbers = [
          '1.234',
          '12.345',
          '123.456',
          '1.234.567',
          '123'
        ];

        testNumbers.forEach(num => {
          const result = matchAndExtract(num, INT_PATTERN_EU);
          expect(result).not.toBeNull();
          expect(result.int.raw).toBe(num);
          expect(result.int.value).toBe(parseInt(num.replace(/\D/g,'')));
        });
      });
    });

    describe('INT_PATTERN_UNDERSCORE', () => {
      test('should match underscore-separated integers', () => {
        const testNumbers = [
          '1_234',
          '12_345',
          '123_456',
          '1_234_567',
          '123'
        ];

        testNumbers.forEach(num => {
          const result = matchAndExtract(num, INT_PATTERN_UNDERSCORE);
          expect(result).not.toBeNull();
          expect(result.int.raw).toBe(num);
          expect(result.int.value).toBe(parseInt(num.replace(/\D/g,'')));
        });
      });
    });

    describe('FLOAT_PATTERN_US', () => {
      test('should match US float format', () => {
        const testNumbers = [
          '1,234.56',
          '12,345.67',
          '123,456.78',
          '1,234,567.89',
          '123.45'
        ];

        testNumbers.forEach(num => {
          const result = matchAndExtract(num, FLOAT_PATTERN_US);
          // throw new Error(`${typeof  result.raw}, ${typeof  result.value}, ${typeof num}`)
          expect(result).not.toBeNull();
          expect(result.float.raw).toBe(num);
          expect(result.float.value).toBe(parseFloat(num.replace(/[^\d\.]/g,'')));
        });
      });

      test('should extract float components', () => {
        const result = matchAndExtract('1,234.56', FLOAT_PATTERN_US);
        expect(result.float.raw).toBe("1,234.56");
        expect(result.float.value).toBe(1234.56);
      });
    });

    describe('FLOAT_PATTERN_EU', () => {
      test('should match EU float format', () => {
        const testNumbers = [
          '1.234,56',
          '12.345,67',
          '123.456,78',
          '1.234.567,89',
          '123,45'
        ];

        testNumbers.forEach(num => {
          const result = matchAndExtract(num, FLOAT_PATTERN_EU);
          expect(result).not.toBeNull();
          expect(result.float.raw).toBe(num);
          expect(result.float.value).toBe(parseFloat(num.replace('.','').replace(',','.')));
        });
      });

      test('should extract float components', () => {
        const result = matchAndExtract('1.234,56', FLOAT_PATTERN_EU);
        // expect(result).toBe({ raw: '1.234,56', value: 1234.56 });
        expect(result.float.raw).toBe('1.234,56');
        expect(result.float.value).toBe(1234.56);
      });
    });
  });

  describe('State Patterns', () => {
    describe('STATE_CODE_PATTERN', () => {
      test('should match US state codes', () => {
        const testCodes = ['CA', 'NY', 'TX', 'FL', 'WA', 'OR'];

        testCodes.forEach(code => {
          const result = matchAndExtract(code, STATE_CODE_PATTERN);
          expect(result).not.toBeNull();
          expect(result.state.stateCode).toBe(code);
        });
      });

      test('should not match invalid codes', () => {
        const invalidCodes = ['XX', '123', 'ca', 'CAL'];

        invalidCodes.forEach(code => {
          const result = matchAndExtract(code, STATE_CODE_PATTERN);
          expect(result).toBeNull();
        });
      });
    });

    describe('STATE_NAME_PATTERN', () => {
      test('should match US state names', () => {
        const testNames = [
          'California',
          'New York',
          'Texas',
          'Florida',
          'Washington',
          'North Carolina',
          'South Dakota'
        ];

        testNames.forEach(name => {
          const result = matchAndExtract(name, STATE_NAME_PATTERN);
          expect(result).not.toBeNull();
          expect(result.state.stateName).toBe(name);
        });
      });
    });

    describe('STATE_PATTERN', () => {
      test('should match both codes and names', () => {
        const testStates = [
          'CA',
          'California',
          'NY',
          'New York',
          'TX',
          'Texas'
        ];

        testStates.forEach(state => {
          const result = matchAndExtract(state, STATE_PATTERN);
          expect(result).not.toBeNull();
          expect(result.state.state).toBe(state);
        });
      });
    });
  });

  describe('Number Utility Functions', () => {
    describe('toInt', () => {
      test('should convert valid integers', () => {
        expect(toInt('123')).toBe(123);
        expect(toInt('0')).toBe(0);
        expect(toInt('-456')).toBe(-456);
      });

      test('should handle edge cases', () => {
        expect(toInt('')).toBe(null);
        expect(toInt('null')).toBe(null);
        expect(toInt('NULL')).toBe(null);
      });
    });

    describe('toFloat', () => {
      test('should convert valid floats', () => {
        expect(toFloat('123.45')).toBe(123.45);
        expect(toFloat('0.0')).toBe(0);
        expect(toFloat('-456.78')).toBe(-456.78);
      });

      test('should handle edge cases', () => {
        expect(toFloat('')).toBe(null);
        expect(toFloat('null')).toBe(null);
        expect(toFloat('NULL')).toBe(null);
      });
    });

    describe('isInt', () => {
      test('should identify valid integers', () => {
        expect(isInt('123')).toBe(true);
        expect(isInt('0')).toBe(true);
        expect(isInt('-456')).toBe(true);
      });

      test('should reject invalid integers', () => {
        expect(isInt('123.45')).toBe(false);
        expect(isInt('abc')).toBe(false);
        expect(isInt('')).toBe(false);
      });
    });

    describe('isFloat', () => {
      test('should identify valid floats', () => {
        expect(isFloat('123.45')).toBe(true);
        expect(isFloat('0.0')).toBe(true);
        expect(isFloat('-456.78')).toBe(true);
        expect(isFloat('123')).toBe(true); // integers are also floats
      });

      test('should reject invalid floats', () => {
        expect(isFloat('abc')).toBe(false);
        expect(isFloat('')).toBe(false);
        expect(isFloat('12.34.56')).toBe(false);
      });
    });
  });

  describe('Phone Number Utility Functions', () => {
    describe('toPhoneNumber', () => {
      test('should parse phone numbers', () => {
        const result = toPhoneNumber('+1-555-123-4567');
        expect(result).toBeDefined();
        expect(result.countryCode).toBe('1');
        expect(result.areaCode).toBe('555');
        expect(result.telephonePrefix).toBe('123');
        expect(result.lineNumber).toBe('4567');
      });
    });

    describe('isPhoneNumber', () => {
      test('should validate phone numbers', () => {
        expect(isPhoneNumber('+1-555-123-4567')).toBe(true);
        expect(isPhoneNumber('(555) 123-4567')).toBe(true);
        expect(isPhoneNumber('555-123-4567')).toBe(true);
      });

      test('should reject invalid phone numbers', () => {
        expect(isPhoneNumber('123')).toBe(false);
        expect(isPhoneNumber('not-a-phone')).toBe(false);
        expect(isPhoneNumber('555-123')).toBe(false);
      });
    });
  });

  describe('State Utility Functions', () => {
    describe('matchAnyState', () => {
      test('should match state codes', () => {
        const result = matchAnyState('CA');
        expect(result).toBeDefined();
        expect(result.state.stateCode).toBe('CA');
        expect(result.state.stateName).toBe('California');
      });

      test('should match state names', () => {
        const result = matchAnyState('California');
        expect(result).toBeDefined();
        expect(result.state.stateCode).toBe('CA');
        expect(result.state.stateName).toBe('California');
      });


      test('should return null for invalid states', () => {
        const result = matchAnyState('InvalidState');
        expect(result).toBeNull();
      });
    });
  });

  describe('Integration with re template', () => {
    test('should work with email in templates', () => {
      const pattern = re`Contact: ${EMAIL_PATTERN.as('contact')}`;
      const result = matchAndExtract('Contact: john@example.com', pattern);
      
      expect(result.contact).toBe('john@example.com');
      expect(result.emailHandle).toBe('john');
      expect(result.emailDomain).toBe('example.com');
      expect(result.emailTLD).toBe('com');
    });

    test('should work with phone numbers in templates', () => {
      const pattern = re`Phone: ${PHONE_NUMBER_PATTERN}`;
      const result = matchAndExtract('Phone: +1-555-123-4567', pattern).phone;
      
      expect(result.phone).toBe('+1-555-123-4567');
      expect(result.countryCode).toBe('1');
      expect(result.areaCode).toBe('555');
    });

    test('should work with state patterns in templates', () => {
      const pattern = re`State: ${STATE_PATTERN}`;
      const result = matchAndExtract('State: CA', pattern);
      
      expect(result.state.state).toBe('CA');
    });

    test('should work with number patterns in templates', () => {
      const pattern = re`Amount: ${FLOAT_PATTERN_US.as('amount')}`;
      const result = matchAndExtract('Amount: 1,234.56', pattern);
      
      expect(result.amount.raw).toBe('1,234.56');
      expect(result.amount.value).toBe(1234.56);
    });
  });

  describe('Complex parsing scenarios', () => {
    test('should parse contact information', () => {
      const pattern = re`Name: ${/\w+/.as('name')},\s*
Email:\s*${EMAIL_PATTERN},\s*
Phone:\s*${PHONE_NUMBER_PATTERN},\s*
State:\s*${STATE_PATTERN}\s*`.withParsers({
        name: (s: string) => s.toUpperCase(),
      });

      const result = matchAndExtract(`Name: john, 
Email: john@example.com, 
Phone: +1-555-123-4567,
State: CA`, pattern);

      expect(result.name).toBe('JOHN');
      expect(result.email).toBe('john@example.com');
      expect(result.phone.phone).toBe('+1-555-123-4567');
      expect(result.state.state).toBe('CA');
    });

    test('should parse financial data', () => {
      const pattern = re`Revenue: ${FLOAT_PATTERN_US.as('revenue')}, Units: ${INT_PATTERN_US.as('units')}`;

      const result = matchAndExtract('Revenue: 1,234,567.89, Units: 1,234', pattern);

      expect(result.revenue.value).toBe(1234567.89);
      expect(result.units.value).toBe(1234);
    });
  });
});
