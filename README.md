# Aggvar #

Aggvar is an attempt at an Ansible module which composes multiple external json and yaml files into a single ansible_fact.

# Status #

At present this module does not work:

* I have found no way to pass in files to the module, the module appears to be invoked as an island with not but it's passed in arguments.
* The module has to re-deploy itself from source.
