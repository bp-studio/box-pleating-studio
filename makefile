
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

LIB := lib/include
NLOPT := nlopt.slsqp.2.9.1

CXXFLAG_dist = -O3 -fno-exceptions -flto
CXXFLAG_dist_mp = -O3 -fno-exceptions -flto -fopenmp -pthread -mbulk-memory
CXXFLAG_debug = -g -Wno-limited-postlink-optimizations -sNO_DISABLE_EXCEPTION_CATCHING -D_OPENMP

DEP_dist = $(LIB)/lib$(NLOPT).a
DEP_dist_mp = $(LIB)/lib$(NLOPT)-mp.a $(LIB)/libsimpleomp.a
DEP_debug = $(LIB)/lib$(NLOPT).a

POST_dist_mp = @node lib/optimizer/post-build.js

LDFLAG_dist = -l$(NLOPT) -sENVIRONMENT=worker -sASYNCIFY=1
LDFLAG_dist_mp = -l$(NLOPT)-mp -lsimpleomp -sPTHREAD_POOL_SIZE=navigator.hardwareConcurrency -sENVIRONMENT=worker
LDFLAG_debug = -l$(NLOPT) -sENVIRONMENT=node

# https://emscripten.org/docs/tools_reference/emcc.html
# https://github.com/emscripten-core/emscripten/blob/main/src/settings.js

CPPFLAGS := -I$(SRCF) -I$(LIB) -std=c++20
CXXFLAGS := $(CXXFLAG_$(MODE))
LDFLAGS :=\
	-L$(LIB)\
	-lembind\
	$(LDFLAG_$(MODE))\
	-sFILESYSTEM=0\
	-sINITIAL_MEMORY=10MB\
	-sALLOW_MEMORY_GROWTH\
	-sMIN_SAFARI_VERSION=120000\
	-sASSERTIONS\
	-sMAXIMUM_MEMORY=4GB\
	-sEXPORT_ES6=1

WASM := $(TARGET)/$(OUT).js

ifeq ($(OS),Windows_NT)
# Error is still possible in parallel running, so we add extra protection
	MK = -@if not exist "$(@D)" mkdir "$(@D)" 2> NUL
	RM = rmdir /s /q
else
	MK = @mkdir -p "$(@D)"
endif

.PHONY: all
all: $(WASM)

$(WASM): $(OBJ) makefile $(DEP_$(MODE))
	$(MK)
	@echo Compiling [33m$(WASM)[0m
	@$(LINK.cc) $(USRFLAGS) -o $@ $(OBJ)
	$(POST_$(MODE))
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

.PHONY: mp
mp:
	@$(MAKE) MODE=dist_mp --no-print-directory
