
MAKEFLAGS += -j12

CXX := em++

MODE ?= debug
SRCF := src/client/plugins/optimizer/src
TEMP := build/obj/$(MODE)
TARGET := lib/optimizer/$(MODE)

SRC := $(wildcard $(SRCF)/*.cpp) $(wildcard $(SRCF)/*/*.cpp) $(wildcard $(SRCF)/*/*/*.cpp)
OBJ := $(patsubst $(SRCF)/%.cpp,$(TEMP)/%.o,$(SRC))
DEP := $(patsubst $(SRCF)/%.cpp,$(TEMP)/%.d,$(SRC))

OUT := optimizer

CXXFLAG_dist = -O3 -fno-exceptions
CXXFLAG_debug = -g -Wno-limited-postlink-optimizations -sNO_DISABLE_EXCEPTION_CATCHING

LDFLAG_dist = -sENVIRONMENT=worker
LDFLAG_debug = -sENVIRONMENT=node

# https://emscripten.org/docs/tools_reference/emcc.html
# https://github.com/emscripten-core/emscripten/blob/main/src/settings.js

CPPFLAGS := -I$(SRCF) -Ilib/nlopt -std=c++20
CXXFLAGS := $(CXXFLAG_$(MODE))
LDFLAGS :=\
	-Llib/nlopt\
	-lembind\
	-lnlopt.slsqp.2.9.0\
	$(LDFLAG_$(MODE))\
	-sFILESYSTEM=0\
	-sINITIAL_MEMORY=10MB\
	-sALLOW_MEMORY_GROWTH\
	-sASYNCIFY=1\
	-sMIN_SAFARI_VERSION=120000\
	-sASSERTIONS\
	-sMAXIMUM_MEMORY=4GB\
	-sEXPORT_ES6=1

WASM := $(TARGET)/$(OUT).mjs

ifeq ($(OS),Windows_NT)
# Error is still possible in parallel running, so we add extra protection
	MK = -@if not exist "$(@D)" mkdir "$(@D)" 2> NUL
	RM = rmdir /s /q
else
	MK = @mkdir -p "$(@D)"
endif

.PHONY: all
all: $(WASM)

$(WASM): $(OBJ) makefile
	$(MK)
	@echo Compiling [33m$(WASM)[0m
	@$(LINK.cc) $(USRFLAGS) -o $@ $(OBJ)
	@echo [33mWebAssembly compile complete![0m

$(TEMP)/%.o: $(SRCF)/%.cpp
	$(MK)
	@echo Compiling [32m$(patsubst $(SRCF)/%,%,$<)[0m
	@$(COMPILE.cc) -MMD -c $< -o $@

# Ignoring old dependencies that were removed
%.h: ;
%.hpp: ;
%.d: ;

-include $(DEP)

.PHONY: clean
clean:
	@$(RM) "$(TEMP)"

.PHONY: dist
dist:
	@$(MAKE) MODE=dist --no-print-directory
