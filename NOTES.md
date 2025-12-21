# Development Notes

Stuff that should probably get documented at some point.

## Permission Model

### Write Permissions(_user_, _file_)

Write permissions allow users to update the data of a file.

1. Let _asn_ be the file's ASN
2. Let _asn write roles_ be the `write` roles configured in the configuration
   corresponding to the _asn_'s folder.
3. Let _user roles_ be the _user_'s roles
4. If the _asn write roles_ include one or more roles from the _user roles_
   1. Return `true`
5. If the _file_'s additional `write` roles include one or more roles from the
   _user roles_
   1. Return `true`
6. Return `false`

### Read Permissions(_user_, _file_)

Read permissions allow users to see files without updating them.

1. Let _asn_ be the file's ASN
2. Let _asn read roles_ be the `read` roles configured in the configuration
   corresponding to the _asn_'s folder.
3. Let _user roles_ be the _user_'s roles
4. If _user_ has write permissions for _file_
   1. Return `true`
5. If the _file_'s `tags` include one or more of the `publicTags` configured in
   the configuration
   1. Return `true`
6. If the _asn read roles_ include one or more roles from the _user roles_
   1. Return `true`
7. If the _file_'s additional `read` roles include one or more roles from the
   _user roles_
   1. Return `true`
8. Return `false`
