# Changelog

## 0.12.0 (TBD)

- Fix schema with required properties

## 0.11.0 (2022-10-13)

- Add filter for cases in suites

## 0.10.1 (2022-09-27)

- Fix dry run

## 0.10.0 (2022-09-27)

- Add suppressing the progress display for improved output in CI

## 0.9.0 (2022-09-13)

- Add assertion for error responses like `4xx` response codes

## 0.8.7 (2022-08-24)

- Fix order of exported assertions
- Fix order of exported Excel reports
- Add displaying pending overall requests to spinner

## 0.8.6 (2022-08-23)

- Fix display of overall cases and requests
- Add display of overall requests to spinner

## 0.8.5 (2022-08-23)

- Refactor suite command
- Improve suite output for CLI

## 0.8.4 (2022-08-18)

- Change and align file naming to contain environment name
- Add rendering responses on retries when in verbose mode

## 0.8.3 (2022-08-16)

- Change running order of case requests to sequential
- Change case running to concurrent
- Change file naming for RQ/RS JSON exports to files
- Improve output of printed RQs
- Add possibility to delay cases as a whole

## 0.8.2 (2022-08-11)

- Change retries to take delay into account

## 0.8.1 (2022-08-10)

- Change behavior of delayed requests to push back subsequent (not delayed) 
  ones instead of running them immediately

## 0.8.0 (2022-08-04)

- Add retries for requests

## 0.7.2 (2022-06-09)

- Fix issue with command line flags where value contains an "=" sign

## 0.7.1 (2022-06-02)

- Improve alignment of cells for multiline contents
- Update dependencies
- Fix display of objects and arrays in assertion table

## 0.7.0 (2022-05-31)

- Center markers in Excel reports
- Add asserting captures of previous requests 

## 0.6.0 (2022-05-24)

- Adjust CLI output for better readability
- Hide matched marker if a capture is displayed
- Change creating suite to YAML

## 0.5.1 (2022-05-17)

- Change display of assertions per case instead of run order

## 0.5.0 (2022-05-12)

- Add exporting request and response bodies for suites
- Add exporting request and response bodies for single requests
- Add possibility to print captures without explicit assertions
- Add capturing data from request body

## 0.4.1 (2022-04-28)

- Exclude non suite files when listing suites

## 0.4.0 (2022-04-26)

- Improve error reporting
- Improve Excel auto filters
- Skip waiting if no delayed requests are present
- Improve Excel exports to look cleaner and be easier to work with

## 0.3.0 (2022-03-31)

- Add matrix test cases
- Add delayed requests
- Add YAML support to suites (precedence is JSON)
- Update dependencies

## 0.2.0 (2022-02-03)

- Improve Excel file layout
- Add Excel reporting
- Add grouped assertion printing
- Change JSONPath based evaluation with JSONata
- Add printing request immediately when parsed
- Improve output in case of an error
- Add automated prefixing of captures and assertions
- Fix commands for creating suites, environments and requests
- Remove creating post-response.js as it is not used

## 0.1.0 (2021-11-04)

- Add suite assertions
- Add captures handling for single requests
- Add injecting captures to pre-request scripts
- Add using captures in request chain
- Add printing summary if captures are available
- Add capturing for suite request responses
- Add response capture support
- Add dry run to request command
- Add displaying verbose request on dry run for suites
- Add pre-request script hook
- Add validation of template variables
- Add initial suite handling
- Add creating suites
- Add creating environments
- Add setting request parameters
- Add request duration printing
- Add request and response data printing
- Add basic request handling
- Add initial request command
- Add request handling
- Add request builder
- Add environment loader
- Add creating requests in collections
- Add create:request command
- Add list:suites command
- Add list:environments command
- Add listing collections and requests
