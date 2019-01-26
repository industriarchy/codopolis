#!/bin/bash
ssh $1@codopolis.net  << EOF
  ls;
EOF
