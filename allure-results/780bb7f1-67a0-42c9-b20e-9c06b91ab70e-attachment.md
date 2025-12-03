# Page snapshot

```yaml
- generic [ref=e5]:
  - img "Organization background image" [ref=e6]
  - generic [ref=e8]:
    - generic [ref=e13]:
      - generic [ref=e14]:
        - img "Organization banner logo" [ref=e17]
        - main [ref=e18]:
          - generic [ref=e21]:
            - heading "Sign in" [level=1] [ref=e25]
            - generic [ref=e26]:
              - alert:
                - generic [ref=e27]: Enter a valid email address, phone number, or Skype name.
              - generic [ref=e29]:
                - textbox "Username@alphavsolutions.com" [active] [ref=e30]
                - textbox [ref=e31]
            - link "Can’t access your account?" [ref=e37] [cursor=pointer]:
              - /url: "#"
            - button "Next" [ref=e40] [cursor=pointer]
            - paragraph [ref=e42]:
              - text: Welcome to
              - strong [ref=e43]:
                - emphasis [ref=e44]: Alpha Variance Solutions
              - link "@" [ref=e45] [cursor=pointer]:
                - /url: https://www.alphavsolutions.com/
      - button "Sign-in options undefined" [ref=e51] [cursor=pointer]:
        - generic [ref=e55]: Sign-in options
    - contentinfo [ref=e56]:
      - generic [ref=e57]:
        - link "Terms of use" [ref=e58] [cursor=pointer]:
          - /url: https://www.microsoft.com/en-US/servicesagreement/
        - link "Privacy & cookies" [ref=e59] [cursor=pointer]:
          - /url: https://privacy.microsoft.com/en-US/privacystatement
        - button "Click here for troubleshooting information" [ref=e60] [cursor=pointer]: ...
```